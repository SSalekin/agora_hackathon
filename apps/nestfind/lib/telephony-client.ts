import twilio from 'twilio';
import { createLogger } from './logger';

const log = createLogger({ module: 'telephony-client' });

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface TelephonyCallParams {
  to: string; // landlord phone number
  listingId: string;
  tenantId: string;
  questions: string[];
  language: string;
  questionQueueItemId: string;
}

export interface TelephonyCallResult {
  success: boolean;
  callSid?: string;
  error?: string;
}

export async function initiateTelephonyCall(
  params: TelephonyCallParams
): Promise<TelephonyCallResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    log.error('Twilio credentials not configured');
    return { success: false, error: 'Telephony not configured' };
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  try {
    // Create TwiML for the call
    const twiml = new twilio.twiml.VoiceResponse();

    const twilioLang = getTwilioLanguage(params.language);

    // Language-specific greeting
    const greeting = getGreeting(params.language);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    twiml.say({ language: twilioLang as any }, greeting);

    // Collect answers for each question
    for (let i = 0; i < params.questions.length; i++) {
      const question = params.questions[i];
      twiml.say(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { language: twilioLang as any },
        `Question ${i + 1}: ${question}`
      );

      // Gather speech input
      twiml.gather({
        input: ['speech'],
        action: `${WEBHOOK_BASE_URL}/api/landlord-call-webhook`,
        method: 'POST',
        speechTimeout: 'auto',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        language: twilioLang as any,
      });
    }

    // Thank you message
    const thankYou = getThankYou(params.language);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    twiml.say({ language: twilioLang as any }, thankYou);
    twiml.hangup();

    // Make the call
    const call = await client.calls.create({
      to: params.to,
      from: TWILIO_PHONE_NUMBER,
      twiml: twiml.toString(),
      statusCallback: `${WEBHOOK_BASE_URL}/api/landlord-call-webhook`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    });

    log.info('Telephony call initiated', { callSid: call.sid, to: params.to });
    return { success: true, callSid: call.sid };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Failed to initiate telephony call', error instanceof Error ? error : undefined, { to: params.to });
    return { success: false, error: errorMessage };
  }
}

export async function endTelephonyCall(callSid: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return false;
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  try {
    await client.calls(callSid).update({ status: 'completed' });
    log.info('Telephony call ended', { callSid });
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Failed to end telephony call', error instanceof Error ? error : undefined, { callSid });
    return false;
  }
}

function getTwilioLanguage(languageCode: string): string {
  const languageMap: Record<string, string> = {
    en: 'en-US',
    fr: 'fr-FR',
    vi: 'vi-VN',
    ja: 'ja-JP',
    ko: 'ko-KR',
    th: 'th-TH',
    de: 'de-DE',
    es: 'es-ES',
    it: 'it-IT',
  };
  return languageMap[languageCode] || 'en-US';
}

function getGreeting(language: string): string {
  const greetings: Record<string, string> = {
    en: 'Hello! I am calling from NestFind about an apartment listing. A tenant has some questions they would like me to ask you.',
    fr: "Bonjour! Je vous appelle de NestFind au sujet d'une annonce d'appartement. Un locataire a des questions qu'il aimerait me poser.",
    vi: 'Xin chào! Tôi gọi từ NestFind về một listing căn hộ. Một người thuê có một số câu hỏi muốn tôi hỏi bạn.',
    ja: 'こんにちは！nestFindからお電話しています。アパートのリスティングについて、テナントの方がいくつか質問したいことがあります。',
    ko: '안녕하세요! nestFind에서 전화드립니다. 아파트 리스팅에 대해 세입자가 몇 가지 질문이 있습니다.',
    th: 'สวัสดีค่ะ โทรมาจาก NestFind เกี่ยวกับรายการอพาร์ทเมนท์ มีผู้เช่าที่ต้องการถามคำถามบางอย่าง',
    de: 'Hallo! Ich rufe von NestFind bezüglich einer Apartmentsanzeige an. Ein Mieter hat einige Fragen, die er Ihnen stellen möchte.',
    es: '¡Hola! Llamo de NestFind sobre un anuncio de apartamento. Un inquilino tiene algunas preguntas que le gustaría hacerle.',
    it: 'Ciao! Chiamo da NestFind riguardo a un annuncio di appartamento. Un inquilino ha alcune domande che vorrebbe farti.',
  };
  return greetings[language] || greetings.en;
}

function getThankYou(language: string): string {
  const thankYouMessages: Record<string, string> = {
    en: 'Thank you for your time. Your answers have been recorded. Have a great day!',
    fr: 'Merci pour votre temps. Vos réponses ont été enregistrées. Bonne journée!',
    vi: 'Cảm ơn bạn đã dành thời gian. Câu trả lời của bạn đã được ghi nhận. Chúc bạn một ngày tốt lành!',
    ja: 'お時間をいただきありがとうございます。ご回答は記録されました。良い一日をお過ごしください！',
    ko: '시간을 내주셔서 감사합니다. 답변이 기록되었습니다. 좋은 하루 보내세요!',
    th: 'ขอบคุณที่สละเวลา คำตอบของคุณได้รับการบันทึกแล้ว สวัสดีวัน!',
    de: 'Vielen Dank für Ihre Zeit. Ihre Antworten wurden aufgezeichnet. Einen schönen Tag noch!',
    es: '¡Gracias por su tiempo. Sus respuestas han sido registradas. ¡Que tenga un buen día!',
    it: 'Grazie per il suo tempo. Le sue risposte sono state registrate. Buona giornata!',
  };
  return thankYouMessages[language] || thankYouMessages.en;
}
