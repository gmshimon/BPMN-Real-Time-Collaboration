'use client'

const OnlineUsers = ({count}:{count:number}) => {
    return (
    <div className="text-sm">
      🟢 <span className="font-semibold">{count}</span> online
    </div>
    );
};

export default OnlineUsers;