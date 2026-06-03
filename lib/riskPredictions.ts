import type { District, IncidentStatus, IncidentType, Priority } from "@/lib/types";

export interface RiskPredictionPoint {
  id: string;
  lat: number;
  lng: number;
  type: IncidentType;
  district: District;
  priority: Priority;
  status: IncidentStatus;
  title: string;
  description: string;
  dataSource: string;
  expectedRequests: number;
  confidence: number;
  recommendedAction: string;
}

export const riskPredictions: RiskPredictionPoint[] = [
  {
    id: "INC-071",
    lat: 32.1014,
    lng: 34.8129,
    type: "waste",
    district: "North District",
    priority: "high",
    status: "open",
    title: "חיזוי עומס פינוי אחרי יום העצמאות",
    description: "צפוי ריבוי פניות ניקיון סביב מוקדי בילוי וגינות ציבוריות בצפון העיר.",
    dataSource: "מודל אירועים עירוניים + היסטוריית מוקד 109",
    expectedRequests: 3,
    confidence: 86,
    recommendedAction: "לתגבר מסלול שפ״ע בשעות הבוקר",
  },
  {
    id: "INC-072",
    lat: 32.0789,
    lng: 34.8048,
    type: "traffic",
    district: "Kiryat Borochov",
    priority: "medium",
    status: "in_progress",
    title: "חיזוי עומס תנועה סביב בית ספר",
    description: "ניתוח תנועה מצביע על סיכוי לעומס חריג בשעת איסוף תלמידים.",
    dataSource: "מצלמות תנועה + דפוסי עומס שבועיים",
    expectedRequests: 2,
    confidence: 79,
    recommendedAction: "להציב פקח תנועה בין 13:30 ל-14:30",
  },
  {
    id: "INC-073",
    lat: 32.0669,
    lng: 34.8338,
    type: "utilities",
    district: "Ramat Amidar",
    priority: "high",
    status: "open",
    title: "חיזוי תקלת תאורה חוזרת",
    description: "דפוס נפילות מתח מרמז על סיכון לתקלת תאורת רחוב חוזרת בערב.",
    dataSource: "תחזוקה מונעת + ניטור תשתיות",
    expectedRequests: 2,
    confidence: 82,
    recommendedAction: "לשלוח צוות חשמל לבדיקה יזומה",
  },
];
