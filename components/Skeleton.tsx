
import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
    return (
        <div className={`skeleton rounded-lg ${className}`} />
    );
};

export const WallpaperSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-3">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col gap-1.5 w-full mr-4">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-2 w-1/3" />
                </div>
                <Skeleton className="size-5 rounded-full" />
            </div>
        </div>
    );
};

export const NotificationSkeleton: React.FC = () => {
    return (
        <div className="flex gap-4 p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02]">
            <Skeleton className="size-12 rounded-lg flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-2 w-10" />
                    <Skeleton className="h-2 w-12" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
    );
};

export const ProfileSkeleton: React.FC = () => {
    return (
        <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-700">
            <header className="flex items-center gap-8">
                <Skeleton className="size-24 lg:size-32 rounded-3xl" />
                <div className="space-y-4 flex-1">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-24 rounded-full" />
                        <Skeleton className="h-10 w-24 rounded-full" />
                    </div>
                </div>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                    <WallpaperSkeleton key={i} />
                ))}
            </div>
        </div>
    );
};
