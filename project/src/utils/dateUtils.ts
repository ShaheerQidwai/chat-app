import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

export const formatMessageTime = (timestamp: string): string => {
  console.log(timestamp);
  return timestamp;
  // const date = new Date(timestamp);
  
  // if (isToday(date)) {
  //   console.log(format(date, 'HH:mm'));
  //   return format(date, 'HH:mm');
  // } else if (isYesterday(date)) {
  //   console.log('Yesterday');
  //   return 'Yesterday';
  // } else {
  //   console.log(format(date, 'MMM d'));
  //   return format(date, 'MMM d');
  // }
};

export const formatFullTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return format(date, 'MMM d, yyyy at HH:mm');
};

export const formatLastSeen = (timestamp: string): string => {
  const date = new Date(timestamp);
  return `Last seen ${formatDistanceToNow(date, { addSuffix: true })}`;
};