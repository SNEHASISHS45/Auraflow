
import React from 'react';
import { motion, useAnimation } from 'framer-motion';

interface IconProps {
    animation?: string;
    className?: string;
    size?: number;
}

const transition = {
    duration: 0.5,
    ease: "easeInOut"
};

const pathVariants = {
    initial: { pathLength: 1, opacity: 1 },
    default: { pathLength: 1, opacity: 1 },
    animate: { pathLength: 1, opacity: 1 },
    hover: {
        pathLength: [0, 1],
        opacity: [0.5, 1],
        transition: { duration: 0.5 }
    },
    path: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: { duration: 0.8 }
    },
    'path-loop': {
        pathLength: [1, 0, 1],
        transition: { duration: 1.2, repeat: Infinity }
    }
};

export const HomeIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.rect x="3" y="3" width="7" height="7" variants={pathVariants} initial="initial" animate={animation} />
            <motion.rect x="14" y="3" width="7" height="7" variants={pathVariants} initial="initial" animate={animation} />
            <motion.rect x="14" y="14" width="7" height="7" variants={pathVariants} initial="initial" animate={animation} />
            <motion.rect x="3" y="14" width="7" height="7" variants={pathVariants} initial="initial" animate={animation} />
        </svg>
    );
};

export const SearchIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.circle cx="11" cy="11" r="8" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="m21 21-4.3-4.3" variants={pathVariants} initial="initial" animate={animation} />
        </svg>
    );
};

export const PlusIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const innerPlusVariants = {
        initial: { scale: 1 },
        default: { rotate: 90, transition },
        hover: { rotate: 180, scale: 1.2, transition: { duration: 0.3 } },
        path: pathVariants.path
    };

    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.circle cx="12" cy="12" r="10" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="M12 8v8" variants={innerPlusVariants} initial="initial" animate={animation} />
            <motion.path d="M8 12h8" variants={innerPlusVariants} initial="initial" animate={animation} />
        </svg>
    );
};

export const BookmarkIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { y: 0, transition },
        hover: { y: -2, scale: 1.1, transition: { duration: 0.2 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" variants={variants} initial="initial" animate={animation} />
        </svg>
    );
};

export const UserIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { scale: 1, transition },
        hover: { scale: 1.15, transition: { duration: 0.2 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" variants={variants} initial="initial" animate={animation} />
            <motion.circle cx="12" cy="7" r="4" variants={variants} initial="initial" animate={animation} />
        </svg>
    );
};

export const BellIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const bellVariants = {
        ...pathVariants,
        default: { rotate: 0 },
        hover: { rotate: [0, 15, -15, 10, -10, 0], transition: { duration: 0.5 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" variants={bellVariants} initial="initial" animate={animation} />
            <motion.path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" variants={pathVariants} initial="initial" animate={animation} />
        </svg>
    );
};

export const XIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M18 6 6 18" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="m6 6 12 12" variants={pathVariants} initial="initial" animate={animation} />
        </svg>
    );
};

export const LockIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.rect x="3" y="11" width="18" height="11" rx="2" ry="2" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="M7 11V7a5 5 0 0 1 10 0v4" variants={pathVariants} initial="initial" animate={animation} />
        </svg>
    );
};

export const BellOffIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 1 .6 2.8" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.5" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="m2 2 20 20" variants={pathVariants} initial="initial" animate={animation} />
        </svg>
    );
};

export const ArrowLeftIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { x: 0 },
        hover: { x: -4, transition: { duration: 0.2 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="m12 19-7-7 7-7" variants={variants} initial="initial" animate={animation} />
            <motion.path d="M19 12H5" variants={variants} initial="initial" animate={animation} />
        </svg>
    );
};

export const SparklesIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { scale: 1, rotate: 0 },
        hover: { scale: 1.2, rotate: 15, transition: { duration: 0.3 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="m12 3 1.912 5.885L20 10.8l-6.088 1.915L12 18.6l-1.912-5.885L4 10.8l6.088-1.915L12 3Z" variants={variants} initial="initial" animate={animation} />
            <motion.path d="m5 3 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="m19 17 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" variants={pathVariants} initial="initial" animate={animation} />
        </svg>
    );
};

export const ShareIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { y: 0 },
        hover: { y: -4, transition: { duration: 0.2 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" variants={pathVariants} initial="initial" animate={animation} />
            <motion.polyline points="16 6 12 2 8 6" variants={variants} initial="initial" animate={animation} />
            <motion.line x1="12" y1="2" x2="12" y2="15" variants={variants} initial="initial" animate={animation} />
        </svg>
    );
};

export const BrainIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { scale: 1 },
        hover: { scale: 1.1, transition: { duration: 0.3 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.97-3.06 2.5 2.5 0 0 1-1.56-4.23 2.5 2.5 0 0 1 1.57-4.23 2.5 2.5 0 0 1 2.97-3.06A2.5 2.5 0 0 1 9.5 2Z" variants={variants} initial="initial" animate={animation} />
            <motion.path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.97-3.06 2.5 2.5 0 0 0 1.56-4.23 2.5 2.5 0 0 0-1.57-4.23 2.5 2.5 0 0 0-2.97-3.06A2.5 2.5 0 0 0 14.5 2Z" variants={variants} initial="initial" animate={animation} />
        </svg>
    );
};

export const HeartIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { scale: 1 },
        hover: { scale: 1.3, transition: { duration: 0.2 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7Z" variants={variants} initial="initial" animate={animation} />
        </svg>
    );
};

export const EyeIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const eyeVariants = {
        ...pathVariants,
        default: { scale: 1 },
        hover: { scale: [1, 1.2, 1], transition: { duration: 0.4 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" variants={pathVariants} initial="initial" animate={animation} />
            <motion.circle cx="12" cy="12" r="3" variants={eyeVariants} initial="initial" animate={animation} />
        </svg>
    );
};

export const EyeOffIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" variants={pathVariants} initial="initial" animate={animation} />
            <motion.line x1="2" y1="2" x2="22" y2="22" variants={pathVariants} initial="initial" animate={animation} />
        </svg>
    );
};

export const EditIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { rotate: 0 },
        hover: { rotate: [-10, 10, -10, 0], transition: { duration: 0.4 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" variants={variants} initial="initial" animate={animation} />
        </svg>
    );
};

export const TrashIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const lidVariants = {
        ...pathVariants,
        default: { y: 0 },
        hover: { y: -3, transition: { duration: 0.2 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M3 6h18" variants={lidVariants} initial="initial" animate={animation} />
            <motion.path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" variants={pathVariants} initial="initial" animate={animation} />
        </svg>
    );
};

export const ChevronRightIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { x: 0 },
        hover: { x: 4, transition: { duration: 0.2 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="m9 18 6-6-6-6" variants={variants} initial="initial" animate={animation} />
        </svg>
    );
};

export const CloudUploadIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { y: 0 },
        hover: { y: -4, transition: { duration: 0.3, repeat: Infinity, repeatType: "reverse" as const } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" variants={pathVariants} initial="initial" animate={animation} />
            <motion.path d="M12 12v9" variants={variants} initial="initial" animate={animation} />
            <motion.path d="m16 16-4-4-4 4" variants={variants} initial="initial" animate={animation} />
        </svg>
    );
};

export const LayerIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { y: 0 },
        hover: { scale: 1.1, y: -2, transition: { duration: 0.3 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="m12 2 9 4.5-9 4.5-9-4.5 9-4.5Z" variants={variants} initial="initial" animate={animation} />
            <motion.path d="m3 11.5 9 4.5 9-4.5" variants={variants} initial="initial" animate={animation} />
            <motion.path d="m3 16.5 9 4.5 9-4.5" variants={variants} initial="initial" animate={animation} />
        </svg>
    );
};

export const LogoutIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { x: 0 },
        hover: { x: 4, transition: { duration: 0.2 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" variants={pathVariants} initial="initial" animate={animation} />
            <motion.polyline points="16 17 21 12 16 7" variants={variants} initial="initial" animate={animation} />
            <motion.line x1="21" y1="12" x2="9" y2="12" variants={variants} initial="initial" animate={animation} />
        </svg>
    );
};

export const ArrowRightIcon: React.FC<IconProps> = ({ animation, className = "", size = 24 }) => {
    const variants = {
        ...pathVariants,
        default: { x: 0 },
        hover: { x: 4, transition: { duration: 0.2 } }
    };
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <motion.path d="m12 5 7 7-7 7" variants={variants} initial="initial" animate={animation} />
            <motion.path d="M5 12h14" variants={variants} initial="initial" animate={animation} />
        </svg>
    );
};

export const GridIcon: React.FC<IconProps> = HomeIcon;
export const DiscoverIcon: React.FC<IconProps> = SearchIcon;
export const CreateIcon: React.FC<IconProps> = PlusIcon;
export const VaultIcon: React.FC<IconProps> = BookmarkIcon;
export const IdentityIcon: React.FC<IconProps> = UserIcon;
export const UniverseIcon: React.FC<IconProps> = BellIcon;
