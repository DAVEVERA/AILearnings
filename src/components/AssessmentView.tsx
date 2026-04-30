import React, { useState } from 'react';
import { AssessmentQuestion } from '../types';
import { Check, X, AlertCircle, ChevronRight, HelpCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AssessmentViewProps {
  questions: AssessmentQuestion[];
  onComplete: (score: number, maxScore: number) => void;
}

export default function AssessmentView({ questions, onComplete }: AssessmentViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    if (selectedOption === currentQuestion.correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const finalScore = selectedOption === currentQuestion?.correctAnswerIndex ? score + 1 : score;

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      onComplete(finalScore, questions.length);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold font-display uppercase tracking-tight">Vraag {currentIndex + 1} // {questions.length}</h2>
        </div>
        <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">
          Voortgang: {Math.round(((currentIndex + 1) / questions.length) * 100)}%
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="text-xl font-bold leading-tight text-black font-display uppercase tracking-tight">
          {currentQuestion.question}
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {currentQuestion.options.map((option, i) => {
            const isSelected = selectedOption === i;
            const isCorrect = i === currentQuestion.correctAnswerIndex;
            const isWrong = isAnswered && isSelected && !isCorrect;

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={isAnswered}
                className={cn(
                  "p-6 text-left border rounded-xl transition-all text-base group relative overflow-hidden",
                  !isAnswered && isSelected ? "border-black bg-gray-50 shadow-sm" : 
                  !isAnswered ? "border-gray-100 hover:border-black" :
                  isCorrect ? "border-green-500 bg-green-50 text-green-700 shadow-sm" :
                  isWrong ? "border-red-500 bg-red-50 text-red-700" : "border-gray-50 opacity-40"
                )}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <span className="text-[10px] font-bold text-gray-300 w-4">{String.fromCharCode(65 + i)}</span>
                  <span className="font-medium tracking-tight">{option}</span>
                </div>
                {isCorrect && isAnswered && (
                  <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-5">
                    <Check size={80} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 bg-gray-50 border border-gray-100 rounded-xl text-sm leading-relaxed relative overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3 text-gray-400">
                <Info size={16} />
                <span className="font-bold uppercase tracking-widest text-[10px]">Toelichting</span>
              </div>
              <p className="text-gray-600 italic font-medium leading-relaxed">{currentQuestion.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-6">
          {!isAnswered ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className="w-full py-5 bg-black text-white rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-20 transition-all shadow-lg hover:bg-gray-800"
            >
              Antwoord bevestigen
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full py-5 bg-white border border-black text-black rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
            >
              {currentIndex < questions.length - 1 ? 'Volgende vraag' : 'Resultaat bekijken'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
