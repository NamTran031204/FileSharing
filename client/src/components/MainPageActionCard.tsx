import {Button} from 'antd';
import type {ReactNode} from 'react';

export type MainPageActionTone = 'primary' | 'secondary' | 'accent';

interface MainPageActionCardProps {
    icon: ReactNode;
    title: string;
    description: string;
    tone?: MainPageActionTone;
    onClick?: () => void;
}

const toneClasses: Record<MainPageActionTone, {iconBox: string; iconColor: string}> = {
    primary: {
        iconBox: 'bg-primary/10 group-hover:bg-primary',
        iconColor: 'text-primary group-hover:text-white',
    },
    secondary: {
        iconBox: 'bg-secondary/10 group-hover:bg-secondary',
        iconColor: 'text-secondary group-hover:text-white',
    },
    accent: {
        iconBox: 'bg-accent/25 group-hover:bg-primary-dark',
        iconColor: 'text-primary-dark group-hover:text-white',
    },
};

const MainPageActionCard = ({
    icon,
    title,
    description,
    tone = 'primary',
    onClick,
}: MainPageActionCardProps) => {
    const toneStyle = toneClasses[tone];

    return (
        <Button
            type="text"
            onClick={onClick}
            className="group !h-auto !w-full !p-0 !text-left hover:!bg-transparent"
        >
            <article
                className="w-full rounded-2xl border border-border/50 bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
                <div className={`mb-4 inline-flex rounded-xl p-3 transition-colors ${toneStyle.iconBox}`}>
                    <span className={`text-3xl transition-colors ${toneStyle.iconColor}`}>{icon}</span>
                </div>

                <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground">{title}</h3>

                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </article>
        </Button>
    );
};

export default MainPageActionCard;
