import heroHardwareStudio from '../assets/images/hero_hardware_studio_1795244619746.jpg';
import promoEdgeAiBoards from '../assets/images/promo_edge_ai_boards_1795149400775.jpg';
import promoLidarSensor from '../assets/images/promo_lidar_sensor_1795149400100.jpg';
import promoRoboticsArm from '../assets/images/promo_robotics_arm_1795149399896.jpg';
import catMicrocontrollers from '../assets/images/cat_microcontrollers_1795244813884.jpg';
import catSensorsLidar from '../assets/images/cat_sensors_lidar_1795244814394.jpg';
import catMotorsDrivers from '../assets/images/cat_motors_drivers_1795244814366.jpg';
import catRoboticsKits from '../assets/images/cat_robotics_kits_1795244814062.jpg';
import catLipoPower from '../assets/images/cat_lipo_power_1795244813910.jpg';
import catDisplaysHmi from '../assets/images/cat_displays_hmi_1795244814723.jpg';
import catWirelessIot from '../assets/images/cat_wireless_iot_1795244814283.jpg';
import catLabTools from '../assets/images/cat_lab_tools_1795244814382.jpg';

export const BRAND_STUDIO_MEDIA = {
  heroShowcase: heroHardwareStudio,
  roboticsArm: promoRoboticsArm,
  edgeAiBoards: promoEdgeAiBoards,
  lidarSensor: promoLidarSensor,
} as const;

export const CATEGORY_STUDIO_MEDIA: Record<string, string> = {
  microcontrollers: catMicrocontrollers,
  esp32: catMicrocontrollers,
  arduino: catMicrocontrollers,
  'raspberry-pi': catMicrocontrollers,
  stm32: catMicrocontrollers,
  sensors: catSensorsLidar,
  lidar: catSensorsLidar,
  ultrasonic: catSensorsLidar,
  imu: catSensorsLidar,
  motors: catMotorsDrivers,
  servo: catMotorsDrivers,
  stepper: catMotorsDrivers,
  brushless: catMotorsDrivers,
  driver: catMotorsDrivers,
  'robotics-kits': catRoboticsKits,
  arm: catRoboticsKits,
  rover: catRoboticsKits,
  power: catLipoPower,
  lipo: catLipoPower,
  bms: catLipoPower,
  buck: catLipoPower,
  displays: catDisplaysHmi,
  oled: catDisplaysHmi,
  wireless: catWirelessIot,
  lora: catWirelessIot,
  tools: catLabTools,
  soldering: catLabTools,
  analyzer: catLabTools,
};

const WATERMARKED_DOMAIN_PATTERNS = [
  'shutterstock',
  'freepik',
  'istockphoto',
  'dreamstime',
  '123rf',
  'alamy',
  'depositphotos',
  'vecteezy',
  'gettyimages',
  'stock.adobe',
  'watermark',
];

export function isWatermarkedUrl(url?: string | null): boolean {
  if (!url) return false;
  const normalized = url.trim().toLowerCase();
  if (!normalized) return false;
  return WATERMARKED_DOMAIN_PATTERNS.some((pattern) => normalized.includes(pattern));
}
