import type {
  Question,
  QuestionBlank,
  SentenceToken,
  Grade,
  Difficulty,
} from "@/types";
import { splitWords, uuid } from "@/lib/utils";

/** 创建题目时的原始输入 */
export interface RawQuestion {
  id?: string;
  chinese: string;
  english: string;
  /** 需要挖空的单词下标（基于 english 按空格拆分后的索引）。缺省则全部挖空。 */
  blankWordIndexes?: number[];
  grade: Grade;
  unit?: number | null;
  topic?: string | null;
  difficulty?: Difficulty;
  audioUrl?: string | null;
  isActive?: boolean;
}

/**
 * 由英文句子 + 挖空下标构建完整 Question（含 blanks 与 tokens）。
 * 标点（句末 . ? !）会从挖空答案中剥离，作为固定文字保留。
 */
export function buildQuestion(raw: RawQuestion): Question {
  const id = raw.id ?? uuid();
  const words = splitWords(raw.english);
  const blankSet = new Set(
    raw.blankWordIndexes ?? words.map((_, i) => i),
  );

  const tokens: SentenceToken[] = [];
  const blanks: QuestionBlank[] = [];
  let blankIndex = 0;

  words.forEach((word, i) => {
    if (blankSet.has(i)) {
      // 剥离尾部标点，单独成 token
      const m = word.match(/^([A-Za-z'’-]+)([.,!?;:]*)$/);
      const core = m ? m[1] : word;
      const trailing = m ? m[2] : "";

      tokens.push({ text: core, isBlank: true, blankIndex });
      blanks.push({
        id: uuid(),
        questionId: id,
        blankIndex,
        answer: core,
        displayOrder: blankIndex,
      });
      blankIndex += 1;
      if (trailing) tokens.push({ text: trailing, isBlank: false });
    } else {
      tokens.push({ text: word, isBlank: false });
    }
  });

  return {
    id,
    chinese: raw.chinese,
    english: raw.english,
    audioUrl: raw.audioUrl ?? null,
    grade: raw.grade,
    unit: raw.unit ?? null,
    topic: raw.topic ?? null,
    difficulty: raw.difficulty ?? 1,
    isActive: raw.isActive ?? true,
    blanks,
    tokens,
  };
}

/**
 * 根据英文句子 + 按顺序排列的填空答案，反推出被挖空的单词下标。
 * 用于从数据库（仅存答案，不存下标）重建题目 tokens。
 */
export function deriveBlankWordIndexes(
  english: string,
  answersInOrder: string[],
): number[] {
  const words = splitWords(english);
  const indexes: number[] = [];
  let cursor = 0;
  for (const ans of answersInOrder) {
    for (let i = cursor; i < words.length; i += 1) {
      const core = words[i].match(/^([A-Za-z'’-]+)/)?.[1] ?? words[i];
      if (core.toLowerCase() === ans.toLowerCase()) {
        indexes.push(i);
        cursor = i + 1;
        break;
      }
    }
  }
  return indexes;
}
