export type Car = {
  id: string;
  car_name: string;
  model: string;
  color: string;
  daily_price: number;
  odometer: number;
  oil_normal_target: number | null;
  oil_transmission_target: number | null;
  created_at: string;
};

export type Rental = {
  id: string;
  name: string;
  telephone: string;
  national_id: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  odometer: number;
  final_odometer?: number | null;
  rent_amount: number;
  car_id: string;
  created_at: string;
};

export type RentalPhoto = {
  id: string;
  url: string;
  sort_order: number;
};

export type RentalLog = {
  id: string;
  rental_id: string;
  car_id: string;
  action: string;
  actor_username: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  cars?: { car_name: string; model: string } | null;
  rentals?: { name: string } | null;
};

export type MaintenanceRecord = {
  id: string;
  car_id: string;
  oil_normal_current: number | null;
  oil_transmission_current: number | null;
  created_at: string;
  items: MaintenanceItem[];
  total_price: number;
};

export type MaintenanceItem = {
  id: string;
  maintenance_record_id: string;
  item_type: string;
  price: number;
  created_at: string;
};

export type MaintenanceSummary = {
  car_id: string;
  label: string;
  total: number;
};

export type AnalyticsResponse = {
  mostRentedCar: { car_id: string; label: string; count: number } | null;
  mostProfitableCar: { car_id: string; label: string; total: number } | null;
  chartMostRented: { label: string; value: number }[];
  chartMostProfit: { label: string; value: number }[];
  chartMaintenanceCost: { label: string; value: number }[];
};
