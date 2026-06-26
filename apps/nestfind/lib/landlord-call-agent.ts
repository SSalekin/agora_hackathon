import {
  AgoraClient,
  Agent,
  Area,
  DeepgramSTT,
  MiniMaxTTS,
  OpenAI,
} from 'agora-agents';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function createLandlordCallAgent(
  language: string,
  questions: string[]
): Agent {
  const appId = requireEnv('NEXT_PUBLIC_AGORA_APP_ID');
  const appCertificate = requireEnv('NEXT_AGORA_APP_CERTIFICATE');

  const client = new AgoraClient({
    area: Area.AP,
    appId,
    appCertificate,
  });

  const languageInstructions = getLanguageInstructions(language);
  const questionsList = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');

  const prompt = `You are a multilingual assistant calling a landlord to collect answers about an apartment listing.

Language: ${languageInstructions}

The tenant has asked the following questions:
${questionsList}

Your task:
1. Greet the landlord professionally in ${language}
2. Explain that a tenant has questions about their apartment listing
3. Ask each question one by one
4. Record their answers (they may skip questions)
5. Thank them for their time

Be polite, professional, and patient. If the landlord doesn't understand, rephrase the question.
If they skip a question, note it and move to the next one.

After collecting all answers, end the call gracefully.`;

  const greeting = getGreeting(language);

  return new Agent({
    client,
    instructions: prompt,
    greeting,
    failureMessage: 'Please wait a moment.',
    maxHistory: 50,
    turnDetection: {
      config: {
        speech_threshold: 0.5,
        start_of_speech: {
          mode: 'vad',
          vad_config: {
            interrupt_duration_ms: 160,
            prefix_padding_ms: 300,
          },
        },
        end_of_speech: {
          mode: 'vad',
          vad_config: {
            silence_duration_ms: 480,
          },
        },
      },
    },
    advancedFeatures: { enable_rtm: true, enable_tools: true },
    parameters: {
      audio_scenario: 'chorus',
      data_channel: 'rtm',
      enable_error_message: true,
      enable_metrics: true,
    },
  })
    .withStt(
      new DeepgramSTT({
        model: 'nova-3',
        language: language === 'vi' ? 'vi' : language === 'fr' ? 'fr' : 'en',
      })
    )
    .withLlm(
      new OpenAI({
        model: 'gpt-4o-mini',
        greetingMessage: greeting,
        failureMessage: 'Please wait a moment.',
        maxHistory: 15,
        params: {
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 0.95,
        },
      })
    )
    .withTts(
      new MiniMaxTTS({
        model: 'speech_2_6_turbo',
        voiceId: language === 'vi' ? 'Vietnamese_female1' :
                language === 'fr' ? 'French_female1' :
                'English_captivating_female1',
      })
    );
}

function getLanguageInstructions(language: string): string {
  const instructions: Record<string, string> = {
    'en': 'English',
    'fr': 'French (Français)',
    'vi': 'Vietnamese (Tiếng Việt)',
    'ja': 'Japanese (日本語)',
    'ko': 'Korean (한국어)',
    'th': 'Thai (ภาษาไทย)',
    'de': 'German (Deutsch)',
    'es': 'Spanish (Español)',
    'it': 'Italian (Italiano)',
  };

  return instructions[language] || 'English';
}

function getGreeting(language: string): string {
  const greetings: Record<string, string> = {
    'en': 'Hello! I\'m calling from NestFind about an apartment listing. A tenant has some questions they\'d like me to ask you.',
    'fr': 'Bonjour! Je vous appelle de NestFind au sujet d\'une annonce d\'appartement. Un locataire a des questions qu\'il aimerait me poser.',
    'vi': 'Xin chào! Tôi gọi từ NestFind về một listing căn hộ. Một người thuê có một số câu hỏi muốn tôi hỏi bạn.',
    'ja': 'こんにちは！NestFindからお電話しています。アパートのリスティングについて、テナントの方がいくつか質問したいことがあります。',
    'ko': '안녕하세요! NestFind에서 전화드립니다. 아파트 리스팅에 대해 세입자가 몇 가지 질문이 있습니다.',
    'th': 'สวัสดีค่ะ โทรมาจาก NestFind เกี่ยวกับรายการอพาร์ทเมนท์ มีผู้เช่าที่ต้องการถามคำถามบางอย่าง',
    'de': 'Hallo! Ich rufe von NestFind bezüglich einer Apartmentsanzeige an. Ein Mieter hat einige Fragen, die er Ihnen stellen möchte.',
    'es': '¡Hola! Llamo de NestFind sobre un anuncio de apartamento. Un inquilino tiene algunas preguntas que le gustaría hacerle.',
    'it': 'Ciao! Chiamo da NestFind riguardo a un annuncio di appartamento. Un inquilino ha alcune domande che vorrebbe farti.',
  };

  return greetings[language] || greetings['en'];
}
