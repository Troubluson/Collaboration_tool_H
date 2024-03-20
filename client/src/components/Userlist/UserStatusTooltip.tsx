import { Tooltip, message } from 'antd';
import { IUser } from '../../@types/User';
import { useState } from 'react';
import apiClient from '../../api/apiClient';
import { ILatencyMeasurement } from '../../@types/Measurement';

interface Props {
  user: IUser;
  currentUser: IUser | null;
}
const textColor = '#a6aaae';

export const UserStatusTooltip = ({ user, currentUser }: Props) => {
  const [userLatency, setUserLatency] = useState<number | null>(null);

  const getUserLatency = async () => {
    try {
      if (!user?.isActive) {
        setUserLatency(null);
        return;
      }
      const { data } = await apiClient.get<ILatencyMeasurement>(
        `/users/${user.id}/latency`,
      );
      setUserLatency(data.latency || null);
    } catch (error) {
      message.error(`Could not get latency for user ${user.username}`);
    }
  };

  return (
    <Tooltip
      onOpenChange={getUserLatency}
      color="blue"
      title={`latency ${userLatency ? `${userLatency}ms` : '<not available>'}`}
    >
      <span style={{ color: textColor }}>
        {user?.id === currentUser?.id ? `${user.username} (You)` : user.username}
      </span>
    </Tooltip>
  );
};
