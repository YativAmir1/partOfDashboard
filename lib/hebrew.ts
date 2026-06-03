import type { District, IncidentStatus, IncidentType, Priority } from "./types";

export const DISTRICT_LABELS: Record<District, string> = {
  "Marom Nave": "מרום נווה",
  "Tel Hashomer": "תל השומר",
  "Shikun Vatikim": "שיכון ותיקים",
  "Industrial Zone": "אזור התעשייה",
  "National Park": "הפארק הלאומי",
  "City Center": "מרכז העיר",
  "Bursa District": "מתחם הבורסה",
  "Ramat Chen": "רמת חן",
  "Ramat Amidar": "רמת עמידר",
  "Kiryat Borochov": "קריית בורוכוב",
  "Neve Efraim": "נווה אפרים",
  "Old City": "העיר הוותיקה",
  "North District": "צפון העיר",
};

export const PRIORITY_LABELS: Record<Priority | string, string> = {
  critical: "קריטי",
  high: "גבוה",
  medium: "בינוני",
  low: "נמוך",
};

export const STATUS_LABELS: Record<IncidentStatus | string, string> = {
  open: "פתוח",
  in_progress: "בטיפול",
  resolved: "טופל",
  pending: "ממתין",
  done: "הושלם",
  escalated: "הוסלם",
  in_progress_task: "בטיפול",
};

export const ISSUE_CATEGORY_LABELS: Record<string, string> = {
  "Garbage Collection": "פינוי אשפה",
  "פינוי אשפה": "פינוי אשפה",
  Noise: "רעש",
  "רעש": "רעש",
  Parking: "חניה",
  "חניה": "חניה",
  Parks: "גנים ונוף",
  "גנים ונוף": "גנים ונוף",
  Pothole: "מפגע דרך",
  "מפגע דרך": "מפגע דרך",
  "Street Lighting": "תאורת רחוב",
  "תאורת רחוב": "תאורת רחוב",
  "Illegal Dumping": "השלכת פסולת",
  "השלכת פסולת": "השלכת פסולת",
  Graffiti: "גרפיטי",
  "גרפיטי": "גרפיטי",
  Flooding: "הצפות",
  "הצפות": "הצפות",
  "Tree Hazard": "מפגע עצים",
  "מפגע עצים": "מפגע עצים",
  "Sidewalk Damage": "נזק במדרכה",
  "נזק במדרכה": "נזק במדרכה",
  "Animal Control": "פיקוח בעלי חיים",
  "פיקוח בעלי חיים": "פיקוח בעלי חיים",
  "Public Toilet": "שירותים ציבוריים",
  "שירותים ציבוריים": "שירותים ציבוריים",
  "Air Pollution": "זיהום אוויר",
  "זיהום אוויר": "זיהום אוויר",
  "Stray Dogs": "כלבים משוטטים",
  "כלבים משוטטים": "כלבים משוטטים",
};

export const ANOMALY_TYPE_LABELS: Record<string, string> = {
  cctv_offline: "מצלמות לא זמינות",
  noise_complaint: "חריגת רעש",
  power_fault: "תקלה בחשמל",
  safety_incident: "פניית בטיחות",
  traffic_anomaly: "חריגת תנועה",
  utility_pressure: "חריגת לחץ תשתית",
  waste_overflow: "חריגת פינוי אשפה",
  waste_route: "סטיית מסלול פינוי",
  complaint_spike: "עלייה חריגה בפניות",
  response_delay: "עיכוב בזמני טיפול",
  response_time: "חריגת זמן תגובה",
  sensor_alert: "התראת חיישנים",
  traffic_spike: "עומס תנועה חריג",
};

export function districtLabel(value: string) {
  return DISTRICT_LABELS[value as District] ?? value;
}

export function priorityLabel(value: string) {
  return PRIORITY_LABELS[value] ?? value;
}

export function statusLabel(value: string) {
  return STATUS_LABELS[value] ?? value;
}

export function issueCategoryLabel(value: string) {
  return ISSUE_CATEGORY_LABELS[value] ?? value;
}

export function anomalyTypeLabel(value: string) {
  return ANOMALY_TYPE_LABELS[value] ?? value.replace(/_/g, " ");
}
