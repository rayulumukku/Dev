import {
  RegExpMatcher,
  TextCensor,
  englishDataset,
  englishRecommendedTransformers,
  grawlixCensorStrategy,
} from 'obscenity';

const profanityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const textCensor = new TextCensor().setStrategy(grawlixCensorStrategy());

/**
 * Checks if the given text contains any obscene or profane language.
 */
export function hasObscenity(text: string): boolean {
  if (!text) return false;
  return profanityMatcher.hasMatch(text);
}

/**
 * Filters and censors obscene language from the given text using grawlix masking ($*#@).
 */
export function censorObscenity(text: string): string {
  if (!text) return text;
  const matches = profanityMatcher.getAllMatches(text);
  if (matches.length === 0) return text;
  return textCensor.applyTo(text, matches);
}

export { profanityMatcher, textCensor };
