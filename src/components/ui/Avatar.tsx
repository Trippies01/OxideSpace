
interface AvatarProps {
    src: string;
    size?: "sm" | "md" | "lg" | "xl" | "xxl";
    status?: "online" | "idle" | "dnd" | "invisible";
    className?: string;
    onClick?: () => void;
}

export const Avatar = ({ src, size = "md", status, className = "", onClick }: AvatarProps) => {
    const sizes: { [key: string]: string } = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-16 h-16", xl: "w-24 h-24", xxl: "w-32 h-32" };
    const statusColors: { [key: string]: string } = { online: 'bg-green-500', idle: 'bg-yellow-500', dnd: 'bg-red-500', invisible: 'bg-zinc-500' };

    return (
        <div onClick={onClick} className={`relative ${sizes[size]} ${className} cursor-pointer group flex-shrink-0`}>
            <img src={src} className="w-full h-full object-cover rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-all" />
            {status && (
                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${statusColors[status] || 'bg-zinc-500'} rounded-full border-2 border-[#121217] shadow-sm z-10`} />
            )}
        </div>
    );
};
