'use client';

import { useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { colorForName } from '../lib/avatarColors';
import { linkify } from '../lib/linkify';
import AttachmentView from './AttachmentView';
import Avatar from './Avatar';
import ReactionBar from './ReactionBar';
import MessageActionSheet from './MessageActionSheet';
import type { ChatMessage } from '../types/chat';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const SWIPE_TRIGGER_DISTANCE = 60;
const SWIPE_MAX_DISTANCE = 80;
const LONG_PRESS_MS = 450;

interface MessageBubbleProps {
  msg: ChatMessage;
  isOwn: boolean;
  showSenderName: boolean;
  showAvatar: boolean;
  showAvatarColumn?: boolean;
  receipt?: React.ReactNode;
  currentUserId?: string;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (msg: ChatMessage) => void;
  onQuoteClick?: (messageId: string) => void;
}

export default function MessageBubble({
  msg, isOwn, showSenderName, showAvatar, showAvatarColumn = true, receipt, currentUserId,
  onEdit, onDelete, onReact, onReply, onQuoteClick,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(msg.content || '');
  const [dragX, setDragX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeLocked = useRef<'horizontal' | 'vertical' | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const isDeleted = !!msg.deletedAt;

  function saveEdit() {
    if (editValue.trim() && editValue !== msg.content) {
      onEdit?.(msg.id, editValue.trim());
    }
    setIsEditing(false);
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (isDeleted) return;
    e.preventDefault(); // suppress the browser's native right-click menu
    setMenuAnchor({ x: e.clientX, y: e.clientY });
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (isDeleted) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    swipeLocked.current = null;
    setSwiping(true);

    longPressTimer.current = setTimeout(() => {
      setMenuAnchor({ x: touch.clientX, y: touch.clientY });
      setDragX(0);
    }, LONG_PRESS_MS);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    if (swipeLocked.current === null && (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6)) {
      swipeLocked.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    }

    if (swipeLocked.current === 'horizontal') {
      e.preventDefault();
      const clamped = Math.max(0, Math.min(deltaX, SWIPE_MAX_DISTANCE));
      setDragX(clamped);
    }
  }

  function handleTouchEnd() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (dragX >= SWIPE_TRIGGER_DISTANCE) {
      onReply?.(msg);
    }
    setDragX(0);
    setSwiping(false);
    touchStartX.current = null;
    touchStartY.current = null;
    swipeLocked.current = null;
  }

  return (
    <div
      className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${showSenderName ? 'mt-2' : 'mt-0.5'} relative`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
      style={{
        transform: `translateX(${dragX}px)`,
        transition: swiping ? 'none' : 'transform 0.2s ease-out',
      }}
    >
      {dragX > 0 && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex items-center justify-center text-[#3390EC]"
          style={{ opacity: Math.min(dragX / SWIPE_TRIGGER_DISTANCE, 1) }}
        >
          ↩
        </div>
      )}

      {!isOwn && showAvatarColumn && (
        <div className="w-9 shrink-0 self-end">
          {showAvatar && <Avatar name={msg.sender.username} avatarUrl={msg.sender.avatarUrl} size={36} />}
        </div>
      )}

      <div className="max-w-[65%] cursor-pointer select-none md:select-text">
        <div className={`px-3 py-2 rounded-2xl text-sm leading-snug ${isOwn ? 'bg-[#2B5278] rounded-br-md' : 'bg-[#182533] rounded-bl-md'}`}>
          {!isOwn && showSenderName && (
            <p className="text-xs font-medium mb-0.5" style={{ color: colorForName(msg.sender.username) }}>
              {msg.sender.username}
            </p>
          )}

          {msg.replyTo && !isDeleted && (
            <button
              onClick={() => onQuoteClick?.(msg.replyTo!.id)}
              className="block w-full text-left border-l-2 border-[#3390EC] bg-black/20 rounded px-2 py-1 mb-1.5 hover:bg-black/30 transition-colors"
            >
              <p className="text-xs font-medium text-[#3390EC]">{msg.replyTo.sender.username}</p>
              <p className="text-xs text-[#8FA3AD] truncate">
                {msg.replyTo.content || (msg.replyTo.fileName ? `📎 ${msg.replyTo.fileName}` : 'Message')}
              </p>
            </button>
          )}

          {isDeleted ? (
            <p className="italic text-[#8FA3AD]">This message was deleted</p>
          ) : isEditing ? (
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <input
                autoFocus
                className="bg-black/20 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#3390EC]"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="text-[#8FA3AD] hover:text-white">
                  <X size={16} />
                </button>
                <button onClick={saveEdit} className="text-[#3390EC] hover:text-white">
                  <Check size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <AttachmentView msg={msg} />
              {msg.content && <p className="break-words">{linkify(msg.content)}</p>}
            </>
          )}

          {!isEditing && (
            <p className="text-[10px] text-[#8FA3AD] text-right mt-1 flex items-center justify-end gap-1">
              {msg.editedAt && !isDeleted && <span className="italic">edited</span>}
              {formatTime(msg.createdAt)}
              {!isDeleted && receipt}
            </p>
          )}
        </div>

        {!isDeleted && currentUserId && onReact && (
          <ReactionBar
            reactions={msg.reactions || []}
            currentUserId={currentUserId}
            onReact={(emoji) => onReact(msg.id, emoji)}
          />
        )}
      </div>

      {menuAnchor && (
        <MessageActionSheet
          isOwn={isOwn}
          hasText={!!msg.content}
          anchor={menuAnchor}
          onClose={() => setMenuAnchor(null)}
          onReact={(emoji) => onReact?.(msg.id, emoji)}
          onReply={() => onReply?.(msg)}
          onEdit={isOwn ? () => setIsEditing(true) : undefined}
          onDelete={isOwn ? () => onDelete?.(msg.id) : undefined}
          onCopy={msg.content ? () => navigator.clipboard.writeText(msg.content!) : undefined}
        />
      )}
    </div>
  );
}