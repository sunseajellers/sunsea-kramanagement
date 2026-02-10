'use client';

import { Campaign, CampaignStatus } from '@/types';
import { format } from 'date-fns';
import {
    MoreHorizontal, Calendar, Users,
    BarChart2, Mail, Globe, MessageSquare, Share2
} from 'lucide-react';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { updateCampaignStatus } from '@/lib/marketingService';
import toast from 'react-hot-toast';

interface Props {
    campaigns: Campaign[];
    onRefresh: () => void;
}

const COLUMNS: { id: CampaignStatus, title: string, color: string }[] = [
    { id: 'draft', title: 'Drafts', color: 'bg-slate-100' },
    { id: 'scheduled', title: 'Scheduled', color: 'bg-indigo-50' },
    { id: 'active', title: 'Active', color: 'bg-emerald-50' },
    { id: 'completed', title: 'Completed', color: 'bg-blue-50' },
];

const ICONS = {
    email: Mail,
    web: Globe,
    sms: MessageSquare,
    social: Share2,
    ads: BarChart2
};

export default function CampaignBoard({ campaigns, onRefresh }: Props) {

    const onDragEnd = async (result: any) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId as CampaignStatus;

        // Optimistic update could happen here, but for now we'll just wait for the API
        try {
            await updateCampaignStatus(draggableId, newStatus);
            toast.success(`Campaign moved to ${newStatus}`);
            onRefresh();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-300px)] min-h-[500px]">
                {COLUMNS.map((column) => {
                    const columnCampaigns = campaigns.filter(c => c.status === column.id);

                    return (
                        <div key={column.id} className="min-w-[300px] w-[300px] flex flex-col">
                            <div className={`p-4 rounded-t-2xl ${column.color} border-b border-white/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center`}>
                                <h3 className="font-black text-slate-700 text-sm uppercase tracking-wider">{column.title}</h3>
                                <span className="bg-white/50 px-2 py-1 rounded-md text-xs font-bold text-slate-500">
                                    {columnCampaigns.length}
                                </span>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 p-2 space-y-3 rounded-b-2xl ${column.color}/50 bg-slate-50/30 overflow-y-auto`}
                                    >
                                        {columnCampaigns.map((campaign, index) => {
                                            const Icon = ICONS[campaign.type] || Mail;

                                            return (
                                                <Draggable key={campaign.id} draggableId={campaign.id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
                                                        >
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className={`p-2 rounded-lg ${campaign.type === 'email' ? 'bg-blue-100 text-blue-600' :
                                                                    campaign.type === 'social' ? 'bg-pink-100 text-pink-600' :
                                                                        campaign.type === 'ads' ? 'bg-amber-100 text-amber-600' :
                                                                            'bg-slate-100 text-slate-600'
                                                                    }`}>
                                                                    <Icon className="w-4 h-4" />
                                                                </div>
                                                                <button className="text-slate-300 hover:text-slate-500">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            <h4 className="font-bold text-slate-900 mb-2 line-clamp-2 leading-tight">
                                                                {campaign.name}
                                                            </h4>

                                                            <div className="space-y-2">
                                                                <div className="flex items-center text-xs text-slate-500 gap-2">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span>
                                                                        {campaign.scheduleDate
                                                                            ? format(new Date(campaign.scheduleDate), 'MMM dd')
                                                                            : 'Unscheduled'}
                                                                    </span>
                                                                </div>

                                                                {campaign.status === 'active' || campaign.status === 'completed' ? (
                                                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
                                                                        <div className="text-xs">
                                                                            <span className="block font-black text-slate-900">{campaign.metrics.opened}</span>
                                                                            <span className="text-[10px] text-slate-400 uppercase">Opens</span>
                                                                        </div>
                                                                        <div className="text-xs text-right">
                                                                            <span className="block font-black text-emerald-600">${campaign.metrics.revenue}</span>
                                                                            <span className="text-[10px] text-slate-400 uppercase">Revenue</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center text-xs text-slate-500 gap-2">
                                                                        <Users className="w-3 h-3" />
                                                                        <span>Est. Audience: 1.2k</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
