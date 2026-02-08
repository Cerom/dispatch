'use client';

import { useState } from 'react';
import { Task } from '@/lib/db/schema';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
}

type TabType = 'todo' | 'sent' | 'done';

export function TaskList({ tasks, onCompleteTask, onCancelTask, onSelectTask }: TaskListProps) {
  const [activeTab, setActiveTab] = useState<TabType>('todo');

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'todo') {
      return task.status === 'assigned' || task.status === 'in_progress';
    }
    if (activeTab === 'sent') {
      return true; // Show all tasks user requested (filter by requesterId in parent)
    }
    if (activeTab === 'done') {
      return task.status === 'completed';
    }
    return false;
  });

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with tabs */}
      <div className="p-6 pb-4">
        <div className="flex items-baseline gap-4">
          <h1 className="text-3xl font-bold text-gray-900">todo</h1>
          <button
            onClick={() => setActiveTab('sent')}
            className={`text-lg ${
              activeTab === 'sent' ? 'text-gray-900 font-medium' : 'text-gray-400'
            }`}
          >
            sent
          </button>
          <button
            onClick={() => setActiveTab('done')}
            className={`text-lg ${
              activeTab === 'done' ? 'text-gray-900 font-medium' : 'text-gray-400'
            }`}
          >
            done
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No tasks yet
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              hasNotification={task.status === 'assigned'}
              onComplete={activeTab === 'todo' ? onCompleteTask : undefined}
              onCancel={activeTab === 'todo' ? onCancelTask : undefined}
              onClick={onSelectTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
