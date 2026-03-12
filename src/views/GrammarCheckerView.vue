<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "../composables/useI18n";
import {
  PenLine,
  Loader2,
  Copy,
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
  Trash2,
  Languages,
} from "lucide-vue-next";
import { exportResult, type ExportFormat } from "../services/export";
import { toast } from "../stores/toast";
import axios from "axios";

const { t } = useI18n();

const inputText = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const isExportOpen = ref(false);
const selectedLanguage = ref("auto");

interface GrammarMatch {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  replacements: { value: string }[];
  rule: {
    id: string;
    description: string;
    category: { id: string; name: string };
  };
  context: { text: string; offset: number; length: number };
}

const matches = ref<GrammarMatch[]>([]);
const correctedText = ref("");

const languages = [
  { code: "auto", name: "Auto-Detect" },
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "fr", name: "French" },
  { code: "de-DE", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "pt-BR", name: "Portuguese (BR)" },
  { code: "pt-PT", name: "Portuguese (PT)" },
  { code: "nl", name: "Dutch" },
  { code: "it", name: "Italian" },
  { code: "pl-PL", name: "Polish" },
  { code: "ru-RU", name: "Russian" },
  { code: "uk-UA", name: "Ukrainian" },
  { code: "ar", name: "Arabic" },
  { code: "zh-CN", name: "Chinese" },
  { code: "ja-JP", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ro-RO", name: "Romanian" },
  { code: "ca-ES", name: "Catalan" },
  { code: "da-DK", name: "Danish" },
  { code: "el-GR", name: "Greek" },
  { code: "sv", name: "Swedish" },
];

const hasInput = computed(() => inputText.value.trim().length > 0);

// Build corrected text by applying all replacements
const buildCorrectedText = (text: string, matchList: GrammarMatch[]) => {
  if (!matchList.length) return text;
  // Sort matches by offset descending so replacements don't shift positions
  const sorted = [...matchList].sort((a, b) => b.offset - a.offset);
  let result = text;
  for (const m of sorted) {
    if (m.replacements.length > 0 && m.replacements[0]) {
      result =
        result.slice(0, m.offset) +
        m.replacements[0].value +
        result.slice(m.offset + m.length);
    }
  }
  return result;
};

// Check grammar using LanguageTool API
const checkGrammar = async () => {
  if (!hasInput.value) return;

  isLoading.value = true;
  errorMessage.value = "";
  matches.value = [];
  correctedText.value = "";

  try {
    const params = new URLSearchParams();
    params.append("text", inputText.value);
    params.append("language", selectedLanguage.value);

    const response = await axios.post(
      "https://api.languagetool.org/v2/check",
      params,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    matches.value = response.data.matches;

    if (matches.value.length > 0) {
      correctedText.value = buildCorrectedText(inputText.value, matches.value);
    } else {
      correctedText.value = inputText.value;
    }
  } catch {
    errorMessage.value =
      t.value.grammar?.fetchError ||
      "Failed to check grammar. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

// Apply a single suggestion
const applySuggestion = (match: GrammarMatch, replacement: string) => {
  inputText.value =
    inputText.value.slice(0, match.offset) +
    replacement +
    inputText.value.slice(match.offset + match.length);
  // Re-check after applying
  checkGrammar();
};

// Copy corrected text to clipboard
const copyCorrected = async () => {
  try {
    await navigator.clipboard.writeText(correctedText.value);
    toast.show(
      t.value.common?.copiedToClipboard || "Copied to clipboard!",
      "success",
    );
  } catch {
    toast.show(t.value.common?.error || "Error", "error");
  }
};

// Export corrected text
const handleExport = async (format: ExportFormat) => {
  isExportOpen.value = false;
  await exportResult(format, {
    inputText: inputText.value,
    resultText: correctedText.value,
    mode: "summarize",
  });
};

// Clear everything
const clearAll = () => {
  inputText.value = "";
  correctedText.value = "";
  matches.value = [];
  errorMessage.value = "";
};

// Category color mapping
const getCategoryColor = (categoryId: string) => {
  switch (categoryId) {
    case "TYPOS":
    case "SPELLING":
      return "text-red-500 bg-red-100 dark:bg-red-950/40 border-red-300 dark:border-red-700";
    case "GRAMMAR":
      return "text-yellow-600 bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700";
    case "PUNCTUATION":
      return "text-blue-500 bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700";
    case "STYLE":
    case "REDUNDANCY":
      return "text-purple-500 bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700";
    default:
      return "text-orange-500 bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700";
  }
};
</script>

<template>
  <main
    class="min-h-screen bg-gray-50 dark:bg-[#121212] bg-[radial-gradient(circle_at_1px_1px,rgb(209_213_219/0.5)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgb(55_65_81/0.4)_1px,transparent_0)] bg-[length:24px_24px] py-12 px-4"
  >
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4"
        >
          <PenLine class="w-8 h-8 text-emerald-500" />
        </div>
        <h1
          class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
        >
          {{ t.grammar?.title || "Grammar & Spell Checker" }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {{
            t.grammar?.subtitle ||
            "Detect grammar, spelling, and style errors in 30+ languages."
          }}
        </p>
      </div>

      <!-- Main Card -->
      <div
        class="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <!-- Input Section -->
        <div class="p-6 md:p-8">
          <!-- Language selector -->
          <div class="flex items-center justify-between mb-4">
            <label
              for="grammar-input"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {{ t.grammar?.inputLabel || "Your Text" }}
            </label>
            <div class="flex items-center gap-2">
              <Languages class="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <select
                v-model="selectedLanguage"
                class="text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
              >
                <option
                  v-for="lang in languages"
                  :key="lang.code"
                  :value="lang.code"
                >
                  {{ lang.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="relative">
            <textarea
              id="grammar-input"
              v-model="inputText"
              rows="8"
              class="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 resize-none"
              :placeholder="
                t.grammar?.inputPlaceholder ||
                'Type or paste your text here to check for grammar and spelling errors...'
              "
            ></textarea>
            <!-- Character count -->
            <div
              class="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500"
            >
              {{ inputText.length }} {{ t.home?.characters || "characters" }}
            </div>
          </div>

          <!-- Actions row -->
          <div class="flex gap-3 mt-5">
            <button
              @click="checkGrammar"
              :disabled="!hasInput || isLoading"
              class="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :class="
                isLoading
                  ? 'bg-emerald-400 dark:bg-emerald-500'
                  : 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
              "
            >
              <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
              <PenLine v-else class="w-5 h-5" />
              <span>{{
                isLoading
                  ? t.grammar?.checking || "Checking..."
                  : t.grammar?.checkButton || "Check Grammar"
              }}</span>
            </button>

            <button
              v-if="inputText"
              @click="clearAll"
              class="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200 cursor-pointer"
              :title="t.grammar?.clear || 'Clear'"
            >
              <Trash2 class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <Transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div
            v-if="errorMessage"
            class="mx-6 md:mx-8 mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <div class="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle class="w-5 h-5 flex-shrink-0" />
              <span class="text-sm font-medium">{{ errorMessage }}</span>
            </div>
          </div>
        </Transition>

        <!-- Results Section -->
        <Transition
          enter-active-class="transition ease-out duration-500"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="correctedText"
            class="border-t border-gray-200 dark:border-gray-800"
          >
            <!-- Issues Found / No Issues -->
            <div
              class="flex items-center justify-between px-6 md:px-8 py-4 bg-gray-50 dark:bg-[#151515]"
            >
              <div class="flex items-center gap-2">
                <CheckCircle
                  class="w-5 h-5"
                  :class="
                    matches.length === 0 ? 'text-green-500' : 'text-yellow-500'
                  "
                />
                <span
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {{
                    matches.length === 0
                      ? t.grammar?.noErrors || "No errors found!"
                      : (
                          t.grammar?.errorsFound || "{count} issues found"
                        ).replace("{count}", String(matches.length))
                  }}
                </span>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1">
                <button
                  @click="copyCorrected"
                  class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  :title="t.home?.copy || 'Copy'"
                >
                  <Copy class="w-4.5 h-4.5" />
                </button>

                <!-- Export Dropdown -->
                <div class="relative">
                  <button
                    @click="isExportOpen = !isExportOpen"
                    class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    :title="t.home?.export || 'Export'"
                  >
                    <Download class="w-4.5 h-4.5" />
                  </button>

                  <Transition
                    enter-active-class="transition ease-out duration-200"
                    enter-from-class="opacity-0 translate-y-1"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition ease-in duration-150"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 translate-y-1"
                  >
                    <div
                      v-if="isExportOpen"
                      class="absolute right-0 mt-2 w-40 bg-white dark:bg-[#1f1f1f] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-10"
                    >
                      <button
                        @click="handleExport('pdf')"
                        class="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <FileText class="w-4 h-4 text-red-500" /> PDF
                      </button>
                      <button
                        @click="handleExport('docx')"
                        class="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <FileText class="w-4 h-4 text-blue-500" /> DOCX
                      </button>
                      <button
                        @click="handleExport('txt')"
                        class="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <FileText class="w-4 h-4 text-gray-500" /> TXT
                      </button>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <!-- Corrected Text -->
            <div class="px-6 md:px-8 py-6">
              <h3
                class="text-sm font-semibold text-gray-900 dark:text-white mb-3"
              >
                {{ t.grammar?.correctedText || "Corrected Text" }}
              </h3>
              <div
                class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-[#252525] rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                {{ correctedText }}
              </div>
            </div>

            <!-- Issues List -->
            <div v-if="matches.length > 0" class="px-6 md:px-8 pb-6">
              <h3
                class="text-sm font-semibold text-gray-900 dark:text-white mb-3"
              >
                {{ t.grammar?.issuesList || "Issues Details" }}
              </h3>
              <div
                class="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar"
              >
                <div
                  v-for="(match, index) in matches"
                  :key="index"
                  class="rounded-xl border p-4"
                  :class="getCategoryColor(match.rule.category.id)"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span
                          class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20"
                        >
                          {{ match.rule.category.name }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-800 dark:text-gray-200 mb-2">
                        {{ match.message }}
                      </p>
                      <!-- Context with highlighted error -->
                      <div
                        class="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2"
                      >
                        "...{{
                          match.context.text.slice(0, match.context.offset)
                        }}<span
                          class="bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-300 px-0.5 rounded font-bold"
                          >{{
                            match.context.text.slice(
                              match.context.offset,
                              match.context.offset + match.context.length,
                            )
                          }}</span
                        >{{
                          match.context.text.slice(
                            match.context.offset + match.context.length,
                          )
                        }}..."
                      </div>
                      <!-- Suggestions -->
                      <div
                        v-if="match.replacements.length > 0"
                        class="flex items-center gap-2 flex-wrap"
                      >
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                          {{ t.grammar?.suggestions || "Suggestions:" }}
                        </span>
                        <button
                          v-for="(rep, rIdx) in match.replacements.slice(0, 3)"
                          :key="rIdx"
                          @click="applySuggestion(match, rep.value)"
                          class="text-xs font-medium px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer"
                        >
                          {{ rep.value }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Info note -->
      <p class="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
        {{
          t.grammar?.note ||
          "Powered by LanguageTool — supports 30+ languages. No API key required."
        }}
      </p>
    </div>
  </main>
</template>
