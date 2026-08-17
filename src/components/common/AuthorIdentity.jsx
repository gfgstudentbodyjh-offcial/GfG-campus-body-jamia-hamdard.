import React from 'react';
import { useNavigate } from 'react-router-dom';
import RoleBadge from './RoleBadge';
import { resolveAvatarUrl, formatDisplayHandle } from '../../utils/mediaResolver';
import { isCurrentCampusMantri } from '../../utils/mantriUtils';

const slugifyName = (name) => {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
};

export default function AuthorIdentity({
  member,
  author,
  size = 'normal',
  showRole = true,
  showTeam = true,
  timestamp = null,
  clickable = true,
  className = ''
}) {
  const navigate = useNavigate();
  const data = member || author || {};

  const name = data.name || data.fullName || 'Community Member';
  const photo = resolveAvatarUrl(data.photo, name);
  const role = data.role || 'Member';
  const teamName = data.teamName || 'General';
  const targetId = data._id || data.id || data.username || slugifyName(name);

  const handleProfileClick = (e) => {
    if (!clickable || !targetId) return;
    e.stopPropagation();
    e.preventDefault();
    navigate(`/profile/${targetId}`);
  };

  const isSmall = size === 'small' || size === 'sm';
  const isCurrentMantri = isCurrentCampusMantri(data);

  return (
    <div className={`flex items-start gap-2 sm:gap-2.5 min-w-0 ${className}`}>
      {/* Clickable Avatar Button */}
      <button
        type="button"
        onClick={handleProfileClick}
        className={`post-author-avatar flex-shrink-0 touch-manipulation focus:outline-none cursor-pointer group/avatar ${
          clickable ? 'cursor-pointer' : 'cursor-default'
        }`}
        aria-label={`View ${name}'s profile`}
      >
        <img
          src={photo}
          alt={name}
          className={`${
            isSmall
              ? 'w-7 h-7 sm:w-8 sm:h-8 min-w-[28px] min-h-[28px]'
              : 'w-10 h-10 min-w-[40px] min-h-[40px]'
          } aspect-square rounded-full object-cover border shadow-sm group-hover/avatar:border-white transition-colors ${
            isCurrentMantri ? 'border-[#D4A72C] shadow-[0_0_8px_rgba(212,167,44,0.25)]' : 'border-[#2f9e44]'
          }`}
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f9e44&color=fff&bold=true`;
          }}
        />
      </button>

      {/* Name, RoleBadge & Subtitle */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
          <button
            type="button"
            onClick={handleProfileClick}
            className={`post-author-name font-bold text-white text-left leading-snug truncate touch-manipulation focus:outline-none ${
              isSmall ? 'text-xs sm:text-sm' : 'text-sm'
            } ${clickable ? 'hover:text-[#2f9e44] cursor-pointer' : 'cursor-default'}`}
          >
            {name}
          </button>
          {showRole && role && (
            <span onClick={(e) => e.stopPropagation()} className="cursor-default flex-shrink-0">
              <RoleBadge role={role} isCurrentMantri={isCurrentMantri} size={isSmall ? 'sm' : 'normal'} />
            </span>
          )}
        </div>

        {(data.username || showTeam || timestamp) && (
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium truncate font-mono flex items-center gap-1.5 flex-wrap">
            {data.username && !/^[0-9a-fA-F]{24}$/.test(data.username.trim()) && (
              <button
                type="button"
                onClick={handleProfileClick}
                className="text-[#2f9e44] hover:underline focus:outline-none font-semibold"
              >
                {formatDisplayHandle(data.username, name)}
              </button>
            )}
            {data.username && (showTeam || timestamp) && <span>•</span>}
            {showTeam && <span>{teamName}</span>}
            {showTeam && timestamp && <span>•</span>}
            {timestamp && <span>{timestamp}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
