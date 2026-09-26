import json
import asyncio
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.agent.context_manager import get_or_create_context, remove_context
from app.agent.agent_engine import AgenticCallingEngine
from app.voice.tts_service import TTSService
from app.voice.stt_service import STTService
from app.agent.summary_generator import SummaryGenerator

logger = logging.getLogger("calling_agent.websocket")
router = APIRouter(tags=["WebSocket Call Handler"])

@router.websocket("/ws/call/{call_id}")
async def websocket_call_endpoint(websocket: WebSocket, call_id: str):
    await websocket.accept()
    logger.info(f"WebSocket connected for call_id: {call_id}")

    db: Session = SessionLocal()
    customer = None
    try:
        call = db.query(models.Call).filter(models.Call.id == call_id).first()
        if not call:
            logger.warning(f"Call {call_id} not found in DB. Creating temporary call record.")
            call = models.Call(
                id=call_id,
                phone_number="+919876543210",
                direction="OUTBOUND",
                status="IN_PROGRESS",
                outcome="PENDING",
                start_time=datetime.now(timezone.utc)
            )
            db.add(call)
            db.commit()
        else:
            call.status = "IN_PROGRESS"
            call.start_time = datetime.now(timezone.utc)
            db.commit()

        if call.customer_id:
            customer = db.query(models.Customer).filter(models.Customer.id == call.customer_id).first()

        customer_data = {
            "id": customer.id if customer else None,
            "name": customer.name if customer else "Rahul Kumar",
            "company_name": customer.company_name if customer else "",
            "phone_number": call.phone_number,
            "product": customer.product if customer else "Commercial RO System",
            "purpose": customer.purpose if customer else "Product enquiry"
        }

        context = get_or_create_context(call_id, customer_data)
        agent = AgenticCallingEngine(context)

        # 1. Generate initial AI Greeting
        greeting_text = agent.generate_initial_greeting()
        
        # Save transcript for AI turn
        try:
            db_turn1 = models.CallTranscript(
                call_id=call_id,
                speaker="AI",
                message=greeting_text,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(db_turn1)
            db.commit()
        except Exception as e:
            logger.warning(f"Error saving turn 1: {e}")

        # Synthesize TTS audio with 3s timeout
        greeting_audio = None
        try:
            greeting_audio = await asyncio.wait_for(
                TTSService.text_to_speech_base64(greeting_text),
                timeout=3.5
            )
        except Exception as e:
            logger.warning(f"TTS generation timeout or error: {e}. Client will fallback to Web Speech synthesis.")

        await websocket.send_json({
            "event": "ai_response",
            "call_id": call_id,
            "text": greeting_text,
            "audio_base64": greeting_audio,
            "collected_slots": context.get_summary_dict(),
            "missing_slots": context.get_missing_slots(),
            "is_finished": False
        })

        # 2. Main Resilient Conversation Loop
        while True:
            try:
                raw_msg = await websocket.receive_text()
                data = json.loads(raw_msg)
                event_type = data.get("event", "user_speak")

                if event_type == "end_call":
                    logger.info(f"Client requested call end for {call_id}")
                    break

                user_text = data.get("user_text", "")
                audio_b64 = data.get("audio_base64")

                # STT transcription
                transcript_input = await STTService.transcribe_audio_payload(user_text, audio_b64)
                if not transcript_input or not transcript_input.strip():
                    continue

                # Save customer transcript turn
                try:
                    cust_turn = models.CallTranscript(
                        call_id=call_id,
                        speaker="CUSTOMER",
                        message=transcript_input,
                        timestamp=datetime.now(timezone.utc)
                    )
                    db.add(cust_turn)
                    db.commit()
                except Exception as e:
                    logger.warning(f"Error saving customer turn: {e}")

                # Process turn using Agentic AI engine
                ai_reply_text, is_finished = await agent.process_customer_turn(transcript_input)

                # Save AI response transcript turn
                try:
                    ai_turn = models.CallTranscript(
                        call_id=call_id,
                        speaker="AI",
                        message=ai_reply_text,
                        timestamp=datetime.now(timezone.utc)
                    )
                    db.add(ai_turn)
                    db.commit()
                except Exception as e:
                    logger.warning(f"Error saving AI turn: {e}")

                # Synthesize TTS audio with timeout
                ai_audio = None
                try:
                    ai_audio = await asyncio.wait_for(
                        TTSService.text_to_speech_base64(ai_reply_text),
                        timeout=3.5
                    )
                except Exception as e:
                    logger.warning(f"TTS generation error: {e}")

                await websocket.send_json({
                    "event": "ai_response",
                    "call_id": call_id,
                    "text": ai_reply_text,
                    "audio_base64": ai_audio,
                    "collected_slots": context.get_summary_dict(),
                    "missing_slots": context.get_missing_slots(),
                    "is_finished": is_finished
                })

                if is_finished:
                    logger.info(f"Conversation finished naturally for call {call_id}")
                    break

            except WebSocketDisconnect:
                logger.info(f"WebSocket client disconnected for call {call_id}")
                break
            except Exception as turn_err:
                logger.error(f"Error during turn loop for call {call_id}: {turn_err}")
                await websocket.send_json({
                    "event": "error",
                    "message": "Encountered turn error, standing by."
                })

    except WebSocketDisconnect:
        logger.info(f"WebSocket connection closed for call {call_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket handler for call {call_id}: {e}")
    finally:
        # Finalize Call & Generate Post-Call Summary
        try:
            call = db.query(models.Call).filter(models.Call.id == call_id).first()
            if call:
                call.status = "COMPLETED"
                call.end_time = datetime.now(timezone.utc)
                if call.start_time:
                    delta = (call.end_time - call.start_time).total_seconds()
                    call.duration_seconds = max(int(delta), 10)
                db.commit()

                summary_exists = db.query(models.CallSummary).filter(models.CallSummary.call_id == call_id).first()
                if not summary_exists:
                    transcripts = db.query(models.CallTranscript).filter(models.CallTranscript.call_id == call_id).all()
                    t_list = [{"speaker": t.speaker, "message": t.message} for t in transcripts]
                    c_name = customer.name if customer else "Rahul Kumar"
                    
                    s_data = await SummaryGenerator.generate_call_summary(c_name, t_list, call.status)

                    new_sum = models.CallSummary(
                        call_id=call_id,
                        customer_name=s_data.get("customer_name", c_name),
                        requirement=s_data.get("requirement", "Commercial RO System"),
                        capacity=s_data.get("capacity"),
                        location=s_data.get("location"),
                        application=s_data.get("application"),
                        budget=s_data.get("budget"),
                        timeline=s_data.get("timeline"),
                        lead_status=s_data.get("lead_status", "Warm"),
                        follow_up_required=s_data.get("follow_up_required", True),
                        follow_up_notes=s_data.get("follow_up_notes"),
                        key_requirements=s_data.get("key_requirements"),
                        customer_intent=s_data.get("customer_intent"),
                        important_points=s_data.get("important_points"),
                        call_outcome=s_data.get("call_outcome"),
                        summary_text=s_data.get("summary_text")
                    )
                    db.add(new_sum)
                    
                    if s_data.get("lead_status") in ["Hot", "Warm"]:
                        call.outcome = "INTERESTED"
                    elif s_data.get("lead_status") == "Not Interested":
                        call.outcome = "NOT_INTERESTED"
                    elif s_data.get("follow_up_required"):
                        call.outcome = "FOLLOW_UP_REQUIRED"

                    db.commit()

            remove_context(call_id)
        except Exception as ex:
            logger.error(f"Error finalizing call {call_id}: {ex}")
        finally:
            db.close()
