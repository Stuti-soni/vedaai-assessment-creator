const styles = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

export function DifficultyBadge({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${styles[difficulty]}`}>
      {difficulty}
    </span>
  );
}
