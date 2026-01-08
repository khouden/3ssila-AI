import * as sdk from "microsoft-cognitiveservices-speech-sdk";

const speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY;
const speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION;

// Language code mapping for speech recognition
const languageCodeMap: { [key: string]: string } = {
  French: "fr-FR",
  English: "en-US",
  Spanish: "es-ES",
  German: "de-DE",
  Italian: "it-IT",
  Portuguese: "pt-PT",
  Chinese: "zh-CN",
  Japanese: "ja-JP",
  Korean: "ko-KR",
  Arabic: "ar-SA",
  Hindi: "hi-IN",
  Russian: "ru-RU",
  Dutch: "nl-NL",
  Polish: "pl-PL",
  Swedish: "sv-SE",
  Norwegian: "nb-NO",
  Danish: "da-DK",
  Finnish: "fi-FI",
  Greek: "el-GR",
  Turkish: "tr-TR",
  Vietnamese: "vi-VN",
  Thai: "th-TH",
  Indonesian: "id-ID",
  Malay: "ms-MY",
  Czech: "cs-CZ",
  Romanian: "ro-RO",
  Hungarian: "hu-HU",
  Ukrainian: "uk-UA",
  Bengali: "bn-IN",
  Urdu: "ur-PK",
  Swahili: "sw-KE",
};

// Voice name mapping for text-to-speech
const voiceNameMap: { [key: string]: string } = {
  French: "fr-FR-DeniseNeural",
  English: "en-US-JennyNeural",
  Spanish: "es-ES-ElviraNeural",
  German: "de-DE-AmalaNeural",
  Italian: "it-IT-IsabellaNeural",
  Portuguese: "pt-PT-FernandaNeural",
  Chinese: "zh-CN-XiaoxiaoNeural",
  Japanese: "ja-JP-NanomiNeural",
  Korean: "ko-KR-SunHiNeural",
  Arabic: "ar-SA-ZariyahNeural",
  Hindi: "hi-IN-SwaraNeural",
  Russian: "ru-RU-SvetlanaNeural",
  Dutch: "nl-NL-ColetteNeural",
  Polish: "pl-PL-AgnieszkaNeural",
  Swedish: "sv-SE-SofieNeural",
  Norwegian: "nb-NO-IselinNeural",
  Danish: "da-DK-ChristelNeural",
  Finnish: "fi-FI-NooraNeural",
  Greek: "el-GR-AthinaNeural",
  Turkish: "tr-TR-EmelNeural",
  Vietnamese: "vi-VN-HoaiMyNeural",
  Thai: "th-TH-AcharaNeural",
  Indonesian: "id-ID-GadisNeural",
  Malay: "ms-MY-YasminNeural",
  Czech: "cs-CZ-VlastaNeural",
  Romanian: "ro-RO-AmoraNeural",
  Hungarian: "hu-HU-NoemiNeural",
  Ukrainian: "uk-UA-OksanaNeural",
  Bengali: "bn-IN-TanayaNeural",
  Urdu: "ur-PK-UzmaNeural",
  Swahili: "sw-KE-ZumaNeural",
};

export interface SpeechToTextCallbacks {
  onRecognizing?: (transcript: string) => void;
  onRecognized?: (transcript: string) => void;
  onError?: (error: string) => void;
  onSessionStopped?: () => void;
}

/**
 * Initialize and start speech-to-text recognition
 * @param languageName - Language name (e.g., "French", "English")
 * @param callbacks - Callback functions for recognition events
 * @returns SpeechRecognizer instance
 */
export function speechToText(
  languageName: string,
  callbacks: SpeechToTextCallbacks
): sdk.SpeechRecognizer | null {
  try {
    if (!speechKey || speechKey === "your_azure_speech_key_here") {
      throw new Error("Azure Speech API key is not configured");
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      speechKey,
      speechRegion
    );

    // Get language code
    const languageCode = languageCodeMap[languageName] || "en-US";
    speechConfig.speechRecognitionLanguage = languageCode;

    // Create audio configuration from default microphone
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();

    // Create speech recognizer
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // Handle recognizing (interim results)
    recognizer.recognizing = (_s, e) => {
      console.log("Recognizing:", e.result.text);
      if (callbacks.onRecognizing) {
        callbacks.onRecognizing(e.result.text);
      }
    };

    // Handle recognized (final result)
    recognizer.recognized = (_s, e) => {
      console.log(
        "Recognized - Reason:",
        e.result.reason,
        "Text:",
        e.result.text
      );
      if (
        e.result.reason === sdk.ResultReason.RecognizedSpeech &&
        e.result.text
      ) {
        if (callbacks.onRecognized) {
          callbacks.onRecognized(e.result.text);
        }
      } else if (e.result.reason === sdk.ResultReason.NoMatch) {
        if (callbacks.onError) {
          callbacks.onError("No speech could be recognized. Please try again.");
        }
      }
    };

    // Handle errors
    recognizer.canceled = (_s, e) => {
      console.error("Canceled - Reason:", e.reason, "Error:", e.errorDetails);
      if (callbacks.onError) {
        const errorMessage =
          e.reason === sdk.CancellationReason.Error
            ? `Error: ${e.errorDetails}`
            : "Speech recognition was cancelled.";
        callbacks.onError(errorMessage);
      }
    };

    // Handle session events
    recognizer.sessionStarted = (_s, _e) => {
      console.log("Session started");
    };

    recognizer.sessionStopped = (_s, _e) => {
      console.log("Session stopped");
      if (callbacks.onSessionStopped) {
        callbacks.onSessionStopped();
      }
    };

    // Start continuous recognition
    recognizer.startContinuousRecognitionAsync(
      () => {
        console.log("Speech recognition started successfully");
      },
      (error: string) => {
        console.error("Failed to start continuous recognition:", error);
        if (callbacks.onError) {
          callbacks.onError("Failed to start speech recognition: " + error);
        }
      }
    );

    return recognizer;
  } catch (error: any) {
    if (callbacks.onError) {
      callbacks.onError(
        error.message || "Failed to initialize speech recognition"
      );
    }
    return null;
  }
}

/**
 * Stop speech recognition
 * @param recognizer - The SpeechRecognizer instance
 */
export function stopSpeechToText(recognizer: sdk.SpeechRecognizer): void {
  if (recognizer) {
    recognizer.stopContinuousRecognitionAsync(
      () => {
        console.log("Speech recognition stopped");
      },
      (error: string) => {
        console.error("Failed to stop recognition:", error);
      }
    );
  }
}

/**
 * Initialize and perform text-to-speech
 * @param text - Text to be spoken
 * @param languageName - Language name (e.g., "French", "English")
 * @param onError - Error callback
 */
export async function textToSpeech(
  text: string,
  languageName: string,
  onError?: (error: string) => void
): Promise<void> {
  try {
    if (!speechKey || speechKey === "your_azure_speech_key_here") {
      throw new Error("Azure Speech API key is not configured");
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      speechKey,
      speechRegion
    );

    // Get voice name
    const voiceName =
      voiceNameMap[languageName] ||
      voiceNameMap["English"] ||
      "en-US-JennyNeural";
    speechConfig.speechSynthesisVoiceName = voiceName;

    // Create speech synthesizer with default speaker output
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    return new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(text, (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve();
        } else if (result.reason === sdk.ResultReason.Canceled) {
          const error = `Speech synthesis cancelled: ${result.errorDetails}`;
          if (onError) onError(error);
          reject(new Error(error));
        }
      });
    });
  } catch (error: any) {
    const errorMessage =
      error.message || "Failed to perform text-to-speech synthesis";
    if (onError) onError(errorMessage);
    throw error;
  }
}
