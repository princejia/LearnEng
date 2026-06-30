import type { Question, Topic } from "@/types";
import { buildQuestion, type RawQuestion } from "./builder";

/** 话题标签 */
export const MOCK_TOPICS: Topic[] = [
  { id: "t-family", name: "family", label: "家庭" },
  { id: "t-school", name: "school", label: "学校" },
  { id: "t-travel", name: "travel", label: "旅行" },
  { id: "t-daily", name: "daily", label: "日常生活" },
  { id: "t-tech", name: "tech", label: "科技" },
  { id: "t-study", name: "study", label: "学习" },
];

/**
 * 示例题库（mock）。后续会被 eng.pdf 导入的数据替换。
 * blankWordIndexes 指定挖空的单词；缺省全部挖空。
 */
const RAW: RawQuestion[] = [
  {
    chinese: "我们昨天为奶奶举办了一个生日聚会。",
    english: "We had a birthday party for grandma yesterday.",
    blankWordIndexes: [1, 3, 4, 6],
    grade: 6,
    unit: 4,
    topic: "family",
    difficulty: 1,
  },
  {
    chinese: "我们应该过低碳环保的生活。",
    english: "We should live a green life.",
    blankWordIndexes: [1, 2, 4, 5],
    grade: 6,
    unit: 6,
    topic: "daily",
    difficulty: 1,
  },
  {
    chinese: "她正在去学校的路上。",
    english: "She is on her way to school.",
    blankWordIndexes: [2, 3, 4, 5, 6],
    grade: 7,
    unit: 3,
    topic: "school",
    difficulty: 1,
  },
  {
    chinese: "他们已经学习英语三年了。",
    english: "They have been learning English for three years.",
    blankWordIndexes: [1, 2, 3, 5, 6, 7],
    grade: 8,
    unit: 5,
    topic: "study",
    difficulty: 2,
  },
  {
    chinese: "我的家庭有四口人。",
    english: "There are four people in my family.",
    blankWordIndexes: [2, 3, 6, 7],
    grade: 7,
    unit: 1,
    topic: "family",
    difficulty: 1,
  },
  {
    chinese: "我们打算明天去北京旅行。",
    english: "We are going to travel to Beijing tomorrow.",
    blankWordIndexes: [2, 3, 4, 7],
    grade: 7,
    unit: 4,
    topic: "travel",
    difficulty: 1,
  },
  {
    chinese: "他每天早上六点起床。",
    english: "He gets up at six every morning.",
    blankWordIndexes: [1, 2, 4, 5, 6],
    grade: 7,
    unit: 2,
    topic: "daily",
    difficulty: 1,
  },
  {
    chinese: "科技让我们的生活更方便。",
    english: "Technology makes our life more convenient.",
    blankWordIndexes: [1, 4, 5],
    grade: 9,
    unit: 6,
    topic: "tech",
    difficulty: 2,
  },
  {
    chinese: "你应该多读书。",
    english: "You should read more books.",
    blankWordIndexes: [1, 2, 3],
    grade: 7,
    unit: 2,
    topic: "study",
    difficulty: 1,
  },
  {
    chinese: "她喜欢在周末和朋友一起打篮球。",
    english: "She likes playing basketball with friends on weekends.",
    blankWordIndexes: [1, 2, 3, 4, 7],
    grade: 8,
    unit: 3,
    topic: "daily",
    difficulty: 2,
  },
];

export const MOCK_QUESTIONS: Question[] = RAW.map((r) => buildQuestion(r));
