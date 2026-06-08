export type Car = {
  id: string;
  car_name: string;
  model: string;
  color: string;
  daily_price: number;
  odometer: number;
  oil_normal_target: number | null;
  oil_transmission_target: number | null;
  km_since_oil_normal_change: number;
  km_since_oil_transmission_change: number;
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
