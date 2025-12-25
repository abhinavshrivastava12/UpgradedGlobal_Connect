export const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&size=200&background=6366f1&color=fff';

export const getAvatarUrl = (name = 'User') => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=6366f1&color=fff`;
};