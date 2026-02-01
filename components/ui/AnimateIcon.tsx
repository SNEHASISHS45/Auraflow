
import React from 'react';
import { motion } from 'framer-motion';

export type AnimationType = 'path' | 'path-loop' | 'default' | 'pointing' | string;

interface AnimateIconProps {
    children: React.ReactElement;
    animation?: AnimationType;
    className?: string;
    onClick?: () => void;
}

export const AnimateIcon: React.FC<AnimateIconProps> = ({
    children,
    animation = 'default',
    className = "",
    onClick
}) => {
    return (
        <motion.div
            className={`inline-flex items-center justify-center cursor-pointer ${className}`}
            onClick={onClick}
            initial="initial"
            animate={animation}
            whileHover="hover"
            whileTap="tap"
        >
            {React.cloneElement(children, { animation })}
        </motion.div>
    );
};
