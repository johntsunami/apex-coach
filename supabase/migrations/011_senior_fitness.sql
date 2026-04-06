-- Senior fitness system — profile fields and fall risk tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS senior_profile jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fall_risk_level text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_age integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dob date;

-- Senior outcome tracking in sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS senior_indicators jsonb;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS fall_risk_level text;
