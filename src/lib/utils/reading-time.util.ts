import { WORDS_PER_MINUTE } from '../constants/text-limit';
export const readingTime = (text: string): { words: number; text: string } => {
    const wordCount = text.split(' ').length;
    const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);
    return {
        words: wordCount,
        text: `${minutes} min read`,
    };
};
