# Ramat Gan AI Dashboard - Component Report

## Project Purpose

This project is a frontend-only executive demo for a synthetic AI city operations dashboard for Ramat Gan. It uses local JSON/TypeScript data, deterministic timers, and React context to tell a 1-2 minute story: anomaly detection, AI correlation, recommendation, dispatch, citizen update, KPI improvement, and resolution.

There is no backend, database, authentication, or real AI integration. The "AI" behavior is scripted through `DemoContext`, while a separate `HazardContext` reveals a camera/traffic hazard after 30 seconds.

## App Routes

### `app/layout.tsx`
Defines the global RTL Hebrew shell, loads the Heebo font, applies the dark-mode bootstrap script, and wraps all pages with `HazardProvider` and `DemoProvider`. It renders the persistent sidebar, header, scenario alert banner, main content area, and hazard toast.

### `app/page.tsx`
Redirects the root route to `/overview`. This keeps `/overview` as the default first screen for the dashboard demo.

### `app/overview/page.tsx`
Builds the executive overview screen with KPI cards, city health, critical alerts, weather, occasions, top complaint categories, and recurring complaint clusters. It also offers a scenario launch/reset control and reacts to scenario phases by showing correlation status, risk score, detection sources, and animated KPI changes.

### `app/map/page.tsx`
Builds the city map route with category and overlay filters for incidents, bins, cameras, crews, vehicles, and risk zones. When the scenario is active it highlights Marom Nave and shows a risk panel; when idle it shows district load rankings.

### `app/operations/page.tsx`
Builds the operations route for incident handling, field task dispatch, request funnel analysis, response-time charts, and AI decision blocks. It keeps district filtering local to the page and passes it into `useRequestFunnel`.

### `app/citizens/page.tsx`
Builds the citizen-service route with channel intake analytics, 106/contact-center behavior, complaint trends, SLA status, category breakdown, sentiment, and recent complaint lists. It keeps channel filtering local and passes the selected channel into the donut and channel-efficiency charts.

### `app/employees/page.tsx`
Builds the municipal workforce route from `EMPLOYEES_DATA`, including department cards, team status rows, KPI summaries, and expandable weekly schedules. It models staff availability and district coverage for the field-operations story.

### `app/insights/page.tsx`
Builds the AI insights route, which is the main scenario entry point. It shows either the run-scenario button or the active scenario panel, then lists recommendations, anomaly logs, efficiency metrics, and SLA cards.

### `app/cameras/page.tsx`
Renders the smart camera route by delegating to `CameraGrid`. It exists as a thin page wrapper around the camera dashboard component.

## Layout Components

### `Header`
Displays the top bar with the dashboard title, current Jerusalem date/time, brand logo, theme toggle, and scenario-running indicator. It uses `useEffect` for live time/date to avoid hydration mismatch.

### `Sidebar`
Renders the persistent navigation rail with route links, icons, branding, and active route highlighting. It gives the app its fixed operational navigation structure.

### `AlertBanner`
Shows a dismissible red scenario alert whenever `DemoContext` exposes a visible active alert. It is tied to the scripted scenario phases and disappears when dismissed or resolved.

### `HazardToast`
Shows a bottom-left emergency toast after `HazardContext` reveals the hazard at 30 seconds. It auto-dismisses after 9 seconds, supports manual dismissal, and links users to `/cameras`.

### `ThemeToggle`
Toggles the `dark-mode` class on the document root and persists the choice in `localStorage`. It is intentionally client-only because it touches browser storage and DOM classes.

## Overview Components

### `CityHealthGauge`
Renders a semicircle gauge for the current city health score. It animates score changes with `useCountUp` and changes color/label based on score bands.

### `CriticalAlertsSection`
Lists critical incidents from static incident data and hides `INC-ACC-001` until `hazardRevealed` is true. Each alert links into operations and uses category-specific icons, colors, status, and district labels.

### `KpiCard`
Displays a KPI value, optional unit, delta, icon, and sparkline. It animates numeric changes and supports inverted delta logic for metrics where lower is better.

### `WeatherWidget`
Shows a hardcoded 7-day Ramat Gan forecast for the demo week. It includes today’s highlight, high/low temperatures, weather icons, and a marker for a special occasion.

### `SpecialOccasionsWidget`
Shows hardcoded municipal/holiday events for the week and their operational impacts. It helps connect dashboard operations to known upcoming city conditions.

## Map Components

### `LayerFilter`
Provides map controls for incident categories and overlay layers such as smart bins, cameras, crews, vehicles, and risk zones. It receives all selected state and toggle callbacks from the map page.

### `CityMap`
Renders the Leaflet map and all geospatial demo overlays. It shows static incident markers, smart bins, CCTV markers, employee crews, vehicles, scenario spike markers, risk circles, animated crew movement, and the 30-second hazard marker.

### `MapLegend`
Displays a simple legend for incident category colors and status opacity. It appears to be available as a map helper, though the current map page mainly uses `LayerFilter`.

## Operations Components

### `AiDetectionBlock`
Shows either idle anomalies from `anomalies.json` or the active scenario’s AI detection narrative. During the scenario it displays risk, detection sources, live anomaly description, and analysis bullets.

### `SystemDecisionBlock`
Shows either pending recommendations from static data or the scenario’s active recommendation/dispatch pipeline. It ties the decision story to available employee teams and phase-based task status.

### `EventTicker`
Displays a live-looking operational feed from `useLiveTicker`. The ticker is deterministic in event order and adds a new event every 9 seconds.

### `IncidentTable`
Shows sortable and filterable incidents with priority/status badges, source icons, assignees, descriptions, and district labels. It also hides `INC-ACC-001` until the hazard reveal timer fires.

### `ResponseTimeChart`
Renders a department response-time bar chart with an SLA reference line. Bar colors emphasize departments above or below response thresholds.

### `TaskPanel`
Shows the field task dispatch queue. When the demo scenario creates a task, it injects that AI-generated task at the top and changes its displayed status according to the current scenario phase.

## Citizen-Service Components

### `ComplaintCategoryChart`
Aggregates complaints by category and renders the top categories as a horizontal Recharts bar chart. It watches the root `dark-mode` class so chart labels/tooltips adapt to theme changes.

### `ComplaintVolumeChart`
Renders 30-day complaint volume as an area chart with reference lines for deterioration and AI activation. During the scenario it appends a live "now" data point that improves as KPIs recover.

### `Contact106Module`
Models a smart 109/106 contact center with phase-sensitive deflection metrics and sample SLA tickets. It distinguishes within-SLA and over-SLA tickets and changes its badge/metrics as the scenario progresses.

### `RecentComplaintsList`
Shows the latest ten complaints from local complaint data. Each row includes sentiment, category, district, date, description, and status.

### `SatisfactionTrendChart`
Shows the last 14 days of satisfaction and SLA compliance as two line series. It includes a 90% target reference line.

### `SlaGauge`
Displays current SLA compliance as a circular gauge driven by `DemoContext` KPI state. It changes color and label based on whether the value is on target, at risk, or breached.

### `TopComplaintsWidget`
Ranks clustered recurring complaints from `complaintClusters.json`. In compact mode it shows only issue and count, while full mode includes location, category, progress bar, and status.

## Dashboard Analytics Components

### `ChannelDonutChart`
Renders requests by communication channel as an interactive donut chart. Clicking a slice toggles the selected channel and updates center text plus slice opacity.

### `RequestFunnelChart`
Renders the request lifecycle funnel as a vertical bar chart. It labels each stage, colors stages by status, and calculates drop-off percentages between stages.

### `TopCategoriesWidget`
Displays top complaint categories as clickable horizontal bars. The selected category is highlighted and can be cleared by clicking again or using the clear button.

### `ChannelEfficiencyChart`
Shows per-channel resolution and escalation rates as grouped bars. It reads data through `useChannelEfficiency` and can narrow the chart to one selected channel.

### `FieldPerformanceCard`
Summarizes field-operation performance using rates from `useFieldStats`. It compares assigned-to-field versus handled-in-field percentages and calls out the gap.

### `SlaMetricsCards`
Shows three operational SLA cards: average response time, average resolution time, and SLA breach rate. The values come directly from `operationalMetrics.json`.

## Insights Components

### `AnomalyLog`
Lists anomalies from static data and prepends the live scenario anomaly when one exists. It shows severity, district, anomaly type, time, and resolved/open state.

### `EfficiencyMetrics`
Shows AI impact metrics such as hours saved, auto-resolved requests, response minutes saved, and recommendations issued. Its values increase as scenario KPIs improve.

### `RecommendationCard`
Displays an AI recommendation with priority, category, district, description, confidence bar, and estimated impact. It visually marks the injected scenario recommendation when present.

### `RunScenarioButton`
Provides the primary call-to-action to start the scripted AI scenario. It calls `runScenario` from `DemoContext`.

### `ScenarioPanel`
Shows the active scenario timeline, risk score, active area, detection sources, reasoning chain, reset control, and final before/after KPI table. It is the most complete visual explanation of the 60-second scenario engine.

## Camera Components

### `CameraGrid`
Renders the smart camera dashboard from local camera data and scenario state. Marom Nave cameras enter alert mode during active phases, switch to resolved messaging after completion, and each card includes local video/stream display, CCTV overlays, live clock, and event footer.

## Shared Components

### `PriorityBadge`
Maps priority strings to Hebrew labels and colored badge styles. It is reused in recommendations, tasks, and incident-related UI.

### `SentimentIcon`
Shows a small colored dot for positive, neutral, or negative sentiment. It is used by the recent complaints list.

### `SparklineChart`
Wraps a minimal Recharts `LineChart` for small inline trend lines. It is used inside KPI cards.

### `StatusBadge`
Maps incident/task status strings to Hebrew labels, colored dots, and pill styles. It centralizes status display for incidents, tasks, complaints, and alerts.

## Context Providers

### `DemoContext`
Owns the deterministic 60-second scenario engine and current KPI state. It schedules phase transitions, injects the demo recommendation/task/anomaly, animates KPI movement over 20 steps, and exposes derived scenario data to all screens through `useDemo`.

### `HazardContext`
Owns the independent 30-second hazard reveal state. Its `hazardRevealed` flag drives the hidden critical accident incident, hazard toast, and map marker independently from the main scenario.

## Hooks

### `useChannelEfficiency`
Reads channel efficiency metrics from `operationalMetrics.json` and optionally filters by selected channel. It returns chart-ready resolution/escalation data.

### `useContactMetrics`
Reads contact-center metrics from `contactMetrics.json`. It returns total requests, sorted channel intake data, and the informational request rate.

### `useCountUp`
Animates numeric transitions from the previous value to a target value using `requestAnimationFrame`. It is used by gauges, KPI cards, and metric boxes.

### `useDistrictLoad`
Aggregates complaints by district and optionally filters by category/status. It returns sorted district load data plus the highest-load district.

### `useFieldStats`
Derives assigned-to-field and handled-in-field rates from the contact funnel. It supports the field performance card.

### `useLiveTicker`
Creates a deterministic live operations ticker. It starts with stable placeholder times for hydration safety, then updates times and inserts events on an interval after mount.

### `useRequestFunnel`
Returns the default request funnel from contact metrics or recalculates a district-specific funnel from incident data. It supports the operations page district filter.

### `useSlaMetrics`
Returns SLA metrics directly from `operationalMetrics.json`. It is intentionally simple because the app uses static demo data.

### `useTopCategories`
Aggregates complaint categories globally or by selected district. It returns top category counts and percentages for overview analytics.

## Data And Utility Modules

### `lib/data.ts`
Centralizes imports and typed exports for all local JSON data used by the dashboard. It also defines KPI before/after constants plus shared category, priority, and status color/label maps.

### `lib/hebrew.ts`
Centralizes Hebrew labels and helper functions for districts, priorities, statuses, issue categories, and anomaly types. It lets the UI store stable English/domain keys while displaying localized Hebrew text.

### `lib/types.ts`
Defines shared TypeScript types for incidents, markers, tasks, complaints, KPIs, scenario phases, camera feeds, dashboard filters, metrics, and employee management data. It is the contract between local data, hooks, context, and UI components.

### `lib/utils.ts`
Exports the `cn` helper, combining `clsx` and `tailwind-merge` for safe conditional Tailwind class composition. It is used throughout badge and layout components.

### `data/*.json`
Contains all synthetic operational data: incidents, map markers, trends, recommendations, anomalies, tasks, departments, complaints, complaint clusters, cameras, contact metrics, and operational metrics. These files replace any backend or API calls in the demo.

### `data/employeesData.ts`
Contains structured municipal department, team, schedule, supervisor, vehicle, status, district coverage, and mission data. It powers the employees page and employee-team map overlays.

### `public/cameras/*`
Contains local video assets for camera cards. These files let the camera page feel live while still working as an offline demo asset.
