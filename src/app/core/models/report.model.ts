import { EventStatus } from "./event.model";


export interface ReportCount<T extends string = string> {
   status: T;
   count: number;
}


export interface ReportCategoryCount{
   category: string;
   count: number;
}


export interface ReportTicketTypeCount{
   type: string;
   count: number;
   revenue: number;
}


export interface ReportTopEvent{
   id: string;
   title: string;
   goingCount: number;
   capacity: number | null;
}


export interface ReportDateRange {
   from?: string;
   to?: string;
}


export interface ReportsDashboard{
   scope: 'all' | 'own';
   events:{
       total: number;
       byStatus: ReportCount<EventStatus>[];
       byCategory: ReportCategoryCount[];
   };
   tickets: {
       totalRevenue: number;
       byStatus: ReportCount<string>[];
       byType: ReportTicketTypeCount[];
   };
   attendance: {
       registrationsByStatus: ReportCount<string>[];
       topEvents: ReportTopEvent[];
   };
   approvals: {
       byStatus: ReportCount<string>[];
       avgTurnaroundHours: number | null;
   };
}



