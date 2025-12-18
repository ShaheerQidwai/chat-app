import React, { useState } from 'react';
import { ChatSidebar } from '../components/Chat/ChatSidebar';
import { ChatWindow } from '../components/Chat/ChatWindow';
import { UserListModal } from '../components/UserList/UserListModal';
import { CreateGroupModal } from '../components/Group/CreateGroupModal';
import { MessageSearch } from '../components/Search/MessageSearch';
import { NotificationToast } from '../components/Notifications/NotificationToast';

export const ChatPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userListOpen, setUserListOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatSidebar
        onCreateGroup={() => setCreateGroupOpen(true)}
        onShowUserList={() => setUserListOpen(true)}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      
      <ChatWindow onToggleSidebar={toggleSidebar} />

      {/* Modals */}
      <UserListModal
        isOpen={userListOpen}
        onClose={() => setUserListOpen(false)}
      />
      
      <CreateGroupModal
        isOpen={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
      />
      
      <MessageSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <NotificationToast />
    </div>
  );
};