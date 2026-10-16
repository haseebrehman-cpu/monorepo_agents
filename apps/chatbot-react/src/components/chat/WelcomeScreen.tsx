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

function BoxingGloveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 150 150"
      fill="none"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M39 53 C35 37 44 19 63 13 C81 7 102 15 110 30 C114 36 116 42 116 48 C126 39 137 44 138 55 C142 74 128 96 109 111 L109 121 L47 121 C40 106 35 83 34 64 C34 60 36 56 39 53Z"
        fill="#D51E22"
        stroke="#000000"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M35 43 C35 24 49 12 69 12 C89 12 105 24 108 41 C111 59 98 77 81 83 C64 90 45 80 39 64 C36 57 35 50 35 43Z"
        fill="#F13C35"
        stroke="#000000"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M42 40 C44 29 53 20 66 17"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M48 103 L109 103 L109 141 Q109 146 104 146 L54 146 Q48 146 48 140Z"
        fill="#D51E22"
        stroke="#000000"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path d="M51 111 L106 111" stroke="#000000" strokeWidth="4.5" strokeLinecap="round" />
      <path
        d="M66 83 L90 100 M90 83 L66 100"
        stroke="#000000"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M66 122 L106 122 L106 138 L66 138 Q64 138 64 135 L64 125 Q64 122 66 122Z"
        fill="#FFB900"
        stroke="#000000"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M67 130 L105 130" stroke="#000000" strokeWidth="3.5" />
    </svg>
  );
}

function GymBeltIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 100"
      fill="none"
      className="h-5 w-10 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M34 44c-6-10 6-20 24-16 28-10 70-12 108-4 28 6 46 16 46 26s-18 20-46 26c-38 8-80 6-108-4-18 4-30-6-24-16-4-4-4-8 0-12z"
        fill="#E53935"
        stroke="#111111"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M48 46c-2-6 6-12 18-10 24-7 58-8 90-3 22 4 36 11 36 17s-14 13-36 17c-32 5-66 4-90-3-12 2-20-4-18-10-2-3-2-5 0-8z"
        stroke="#111111"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect x="52" y="26" width="40" height="48" rx="7" fill="#FFFFFF" stroke="#111111" strokeWidth="5" />
      <path d="M64 32v36" stroke="#111111" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M64 50h46" stroke="#111111" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M110 50l8-5v10l-8-5z" fill="#111111" />
      <circle cx="136" cy="50" r="5" fill="#FFFFFF" stroke="#111111" strokeWidth="4" />
      <circle cx="156" cy="50" r="5" fill="#FFFFFF" stroke="#111111" strokeWidth="4" />
      <rect x="176" y="36" width="12" height="28" rx="3" fill="#FFFFFF" stroke="#111111" strokeWidth="4.5" />
    </svg>
  );
}

function WeightliftingIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 150"
      fill="none"
      className="h-5 w-7 shrink-0"
      aria-hidden="true"
    >
      <path d="M57 92L94 55" stroke="#000000" strokeWidth="11" strokeLinecap="square" />
      <g stroke="#000000" strokeLinecap="round">
        <path d="M30 68L55 93" strokeWidth="15" />
        <path d="M24 82L41 99" strokeWidth="13" />
        <path d="M43 53L68 78" strokeWidth="15" />
      </g>
      <g stroke="#000000" strokeLinecap="round">
        <path d="M90 22L115 47" strokeWidth="15" />
        <path d="M108 16L125 33" strokeWidth="13" />
        <path d="M80 31L105 56" strokeWidth="15" />
      </g>
      <path
        d="M132 78V66C132 53 141 44 154 44C167 44 176 53 176 66V78"
        stroke="#E53935"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M137 78C128 84 123 95 123 107C123 125 136 137 154 137C172 137 185 125 185 107C185 95 180 84 171 78Z"
        fill="#E53935"
      />
    </svg>
  );
}

function QuestionGlyph({ id }: { id: string }) {
  if (id === "competition-gloves") return <BoxingGloveIcon />;
  if (id === "gym-belts") return <GymBeltIcon />;
  return <WeightliftingIcon />;
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M24 5.5C14.2 5.5 6.5 11.9 6.5 20.1C6.5 24.1 8.3 27.6 11.3 30.1L9.8 37.8L18.2 34.1C20 34.6 22 34.9 24 34.9C33.8 34.9 41.5 28.5 41.5 20.2C41.5 12 33.8 5.5 24 5.5Z"
        fill="#F01818"
      />
      {[17.5, 24, 30.5].map((cx) => (
        <circle key={cx} cx={cx} cy="20.2" r="2.1" fill="#fff" />
      ))}
    </svg>
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
        <ChatIcon />
        <h2 className="text-sm font-semibold text-neutral-900">Popular questions</h2>
      </div>
      <p className="rdx-questions-subtitle mt-1 text-xs text-neutral-500">
        Quick answers to the most common requests.
      </p>
      <div className="mt-2 flex flex-nowrap items-center gap-1">
        {POPULAR_QUESTIONS.map((question) => (
          <button
            key={question.id}
            type="button"
            disabled={disabled}
            onClick={() => onQuestion(question)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border border-rdx-red bg-white px-2 py-1 text-[10px] font-semibold text-rdx-red transition hover:bg-rdx-red hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
