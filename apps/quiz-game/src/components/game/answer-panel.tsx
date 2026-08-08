'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowDown, ArrowUp } from 'lucide-react';
import type { ClientQuestion } from '@/game-engine/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSound } from '@/components/providers/sound-provider';

export interface AnswerPayload {
  selectedAnswerIds?: string[];
  orderedAnswerIds?: string[];
  textAnswer?: string;
}

interface AnswerPanelProps {
  question: ClientQuestion;
  revealed: boolean;
  disabled: boolean;
  correctAnswerIds: string[];
  correctOrderIds: string[] | null;
  correctText: string | null;
  mySelection: AnswerPayload | null;
  onSubmit: (payload: AnswerPayload) => void;
}

export function AnswerPanel({ question, revealed, disabled, correctAnswerIds, correctOrderIds, correctText, mySelection, onSubmit }: AnswerPanelProps) {
  if (question.type === 'WORD_GUESS' || question.type === 'CHARACTER_GUESS') {
    return (
      <TextAnswer
        revealed={revealed}
        disabled={disabled}
        correctText={correctText}
        mySelection={mySelection}
        onSubmit={onSubmit}
      />
    );
  }

  if (question.type === 'ORDERING') {
    return (
      <OrderingAnswer
        question={question}
        revealed={revealed}
        disabled={disabled}
        correctOrderIds={correctOrderIds}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <ChoiceAnswer
      question={question}
      revealed={revealed}
      disabled={disabled}
      correctAnswerIds={correctAnswerIds}
      mySelection={mySelection}
      onSubmit={onSubmit}
    />
  );
}

function ChoiceAnswer({
  question,
  revealed,
  disabled,
  correctAnswerIds,
  mySelection,
  onSubmit,
}: {
  question: ClientQuestion;
  revealed: boolean;
  disabled: boolean;
  correctAnswerIds: string[];
  mySelection: AnswerPayload | null;
  onSubmit: (payload: AnswerPayload) => void;
}) {
  const { play } = useSound();
  const selectedId = mySelection?.selectedAnswerIds?.[0];
  const isGrid = question.type === 'IMAGE_CHOICE';

  return (
    <div className={cn('grid gap-3', isGrid ? 'grid-cols-2' : question.type === 'TRUE_FALSE' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
      {question.options.map((option, index) => {
        const isCorrect = correctAnswerIds.includes(option.id);
        const isSelected = selectedId === option.id;
        const showCorrect = revealed && isCorrect;
        const showWrong = revealed && isSelected && !isCorrect;

        return (
          <motion.button
            key={option.id}
            data-testid="answer-option"
            type="button"
            disabled={disabled}
            onClick={() => {
              play('click');
              onSubmit({ selectedAnswerIds: [option.id] });
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: isSelected && !revealed ? 0.97 : 1,
            }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'flex items-center gap-3 rounded-2xl border-2 p-4 text-right font-bold transition-all disabled:cursor-not-allowed',
              !revealed && 'border-arena-border bg-arena-surface2 hover:border-arena-primary hover:bg-arena-primary/10',
              !revealed && isSelected && 'border-arena-primary bg-arena-primary/20',
              showCorrect && 'animate-pop-in border-arena-success bg-arena-success/20 text-arena-success',
              showWrong && 'animate-shake-x border-arena-danger bg-arena-danger/20 text-arena-danger'
            )}
          >
            <span
              className={cn(
                'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm',
                showCorrect ? 'border-arena-success bg-arena-success text-white' : showWrong ? 'border-arena-danger bg-arena-danger text-white' : 'border-white/30 text-white/60'
              )}
            >
              {showCorrect ? <Check size={16} /> : showWrong ? <X size={16} /> : String.fromCharCode(65 + index)}
            </span>
            {option.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={option.imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
            )}
            <span className="flex-1">{option.textAr}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function TextAnswer({
  revealed,
  disabled,
  correctText,
  mySelection,
  onSubmit,
}: {
  revealed: boolean;
  disabled: boolean;
  correctText: string | null;
  mySelection: AnswerPayload | null;
  onSubmit: (payload: AnswerPayload) => void;
}) {
  const [value, setValue] = useState(mySelection?.textAnswer ?? '');

  return (
    <div className="flex flex-col gap-3">
      <Input
        data-testid="text-answer-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="اكتب إجابتك هنا..."
        className="text-center text-lg"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim() && !disabled) onSubmit({ textAnswer: value.trim() });
        }}
      />
      <Button data-testid="text-answer-submit" size="lg" disabled={disabled || !value.trim()} onClick={() => onSubmit({ textAnswer: value.trim() })}>
        إرسال الإجابة
      </Button>
      {revealed && correctText && (
        <p className="text-center font-bold text-arena-success">الإجابة الصحيحة: {correctText}</p>
      )}
    </div>
  );
}

function OrderingAnswer({
  question,
  revealed,
  disabled,
  correctOrderIds,
  onSubmit,
}: {
  question: ClientQuestion;
  revealed: boolean;
  disabled: boolean;
  correctOrderIds: string[] | null;
  onSubmit: (payload: AnswerPayload) => void;
}) {
  const [order, setOrder] = useState(question.options.map((o) => o.id));

  useEffect(() => {
    setOrder(question.options.map((o) => o.id));
  }, [question.id, question.options]);

  function move(index: number, direction: -1 | 1) {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  const byId = new Map(question.options.map((o) => [o.id, o]));

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">
        {order.map((id, index) => {
          const option = byId.get(id)!;
          const isCorrectPosition = revealed && correctOrderIds && correctOrderIds[index] === id;
          const isWrongPosition = revealed && correctOrderIds && correctOrderIds[index] !== id;
          return (
            <li
              key={id}
              className={cn(
                'flex items-center gap-3 rounded-xl border-2 border-arena-border bg-arena-surface2 p-3 font-bold',
                isCorrectPosition && 'border-arena-success bg-arena-success/20 text-arena-success',
                isWrongPosition && 'border-arena-danger bg-arena-danger/20 text-arena-danger'
              )}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm">{index + 1}</span>
              <span className="flex-1">{option.textAr}</span>
              {!disabled && (
                <div className="flex flex-col">
                  <button type="button" onClick={() => move(index, -1)} className="text-white/50 hover:text-white">
                    <ArrowUp size={16} />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} className="text-white/50 hover:text-white">
                    <ArrowDown size={16} />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <Button data-testid="ordering-submit" size="lg" disabled={disabled} onClick={() => onSubmit({ orderedAnswerIds: order })}>
        تأكيد الترتيب
      </Button>
    </div>
  );
}
