import type { SVGProps } from "react";
import {
  CHATBOT_ICON_SRC,
  POPULAR_QUESTIONS,
  STORE_NAME,
  type MenuOption,
  type QuickQuestion,
} from "./constants";
import MenuGrid from "./MenuGrid";

interface WelcomeScreenProps {
  region: string;
  disabled: boolean;
  onSelect: (option: MenuOption) => void;
  onQuestion: (question: QuickQuestion) => void;
}

function MiniIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-3.5 w-3.5"
      aria-hidden="true"
      {...props}
    />
  );
}

function QuestionGlyph({ id }: { id: string }) {
  if (id === "competition-gloves") {
    return (
      <MiniIcon>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 13.5c-2.2 1.2-3.5 3-3.5 5.2M8 13.5V7.2a1.6 1.6 0 0 1 3.2 0V12M11.2 12V6.2a1.6 1.6 0 0 1 3.2 0V12M14.4 12V7.4a1.6 1.6 0 0 1 3.2 0v6.2c0 2.6-1.6 4.6-4.4 5.6" />
      </MiniIcon>
    );
  }
  if (id === "punch-pads") {
    return (
      <MiniIcon>
        <rect x="4" y="7" width="7" height="10" rx="1.5" />
        <rect x="13" y="7" width="7" height="10" rx="1.5" />
      </MiniIcon>
    );
  }
  return (
    <MiniIcon>
      <path strokeLinecap="round" d="M4 10h4.5v4H4zM15.5 10H20v4h-4.5z" />
      <path strokeLinecap="round" d="M8.5 12h7" />
    </MiniIcon>
  );
}

function PopularQuestions({
  disabled,
  onQuestion,
}: {
  disabled: boolean;
  onQuestion: (question: QuickQuestion) => void;
}) {
  return (
    <section aria-label="Popular questions">
      <div className="flex items-center gap-2">
        <span className="text-rdx-red" aria-hidden="true">
          <MiniIcon>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 16.5 4.5 20l4-2.2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16.5h8.2A4.3 4.3 0 0 0 19.5 12 6.5 6.5 0 1 0 7.2 8.2 4.2 4.2 0 0 0 7 16.5Z" />
          </MiniIcon>
        </span>
        <h2 className="text-sm font-semibold text-neutral-900">Popular questions</h2>
      </div>
      <p className="rdx-questions-subtitle mt-1 text-xs text-neutral-500">
        Quick answers to the most common requests.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {POPULAR_QUESTIONS.map((question) => (
          <button
            key={question.id}
            type="button"
            disabled={disabled}
            onClick={() => onQuestion(question)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rdx-red bg-white px-2.5 py-1 text-[11px] font-semibold text-rdx-red transition hover:bg-rdx-red hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <QuestionGlyph id={question.id} />
            {question.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default function WelcomeScreen({
  region,
  disabled,
  onSelect,
  onQuestion,
}: WelcomeScreenProps) {
  return (
    <div className="rdx-welcome">
      <section className="rdx-welcome-main">
        <div className="rdx-greeting">
          <div className="flex items-start gap-3">
            <img
              src={CHATBOT_ICON_SRC}
              alt=""
              width={64}
              height={64}
              className="h-11 w-11 shrink-0 rounded-full bg-white object-contain ring-2 ring-rdx-red"
            />
            <div className="min-w-0">
              <h2 className="flex items-center gap-1.5 text-base font-semibold text-neutral-900">
                <span aria-hidden="true">👋</span>
                Hi there!
              </h2>
              <p className="mt-0.5 text-xs leading-snug text-neutral-700">
                I&apos;m the {STORE_NAME} {region.toUpperCase()} assistant.
              </p>
              <p className="mt-0.5 text-xs leading-snug text-neutral-500">
                I can help you with your orders, find the right products, check
                stock, and more. How can I help you today?
              </p>
            </div>
          </div>
        </div>
        <MenuGrid disabled={disabled} onSelect={onSelect} />
        <div className="rdx-welcome-questions-inline">
          <PopularQuestions disabled={disabled} onQuestion={onQuestion} />
        </div>
      </section>
    </div>
  );
}
