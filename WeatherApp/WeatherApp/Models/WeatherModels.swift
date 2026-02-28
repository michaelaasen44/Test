import Foundation

// MARK: - Open-Meteo API Response

struct OpenMeteoResponse: Codable {
    let latitude: Double
    let longitude: Double
    let timezone: String
    let current: CurrentWeather
    let minutely15: Minutely15Weather?
    let hourly: HourlyWeather
    let daily: DailyWeather

    enum CodingKeys: String, CodingKey {
        case latitude, longitude, timezone, current, hourly, daily
        case minutely15 = "minutely_15"
    }
}

struct CurrentWeather: Codable {
    let time: String
    let temperature2m: Double
    let apparentTemperature: Double
    let weatherCode: Int
    let windSpeed10m: Double
    let relativeHumidity2m: Int
    let isDay: Int

    enum CodingKeys: String, CodingKey {
        case time
        case temperature2m = "temperature_2m"
        case apparentTemperature = "apparent_temperature"
        case weatherCode = "weather_code"
        case windSpeed10m = "wind_speed_10m"
        case relativeHumidity2m = "relative_humidity_2m"
        case isDay = "is_day"
    }
}

struct Minutely15Weather: Codable {
    let time: [String]
    let precipitation: [Double]
    let precipitationProbability: [Int]

    enum CodingKeys: String, CodingKey {
        case time, precipitation
        case precipitationProbability = "precipitation_probability"
    }
}

struct HourlyWeather: Codable {
    let time: [String]
    let temperature2m: [Double]
    let apparentTemperature: [Double]
    let weatherCode: [Int]
    let precipitationProbability: [Int]

    enum CodingKeys: String, CodingKey {
        case time
        case temperature2m = "temperature_2m"
        case apparentTemperature = "apparent_temperature"
        case weatherCode = "weather_code"
        case precipitationProbability = "precipitation_probability"
    }
}

struct DailyWeather: Codable {
    let time: [String]
    let weatherCode: [Int]
    let temperature2mMax: [Double]
    let temperature2mMin: [Double]
    let precipitationSum: [Double]
    let sunrise: [String]
    let sunset: [String]

    enum CodingKeys: String, CodingKey {
        case time
        case weatherCode = "weather_code"
        case temperature2mMax = "temperature_2m_max"
        case temperature2mMin = "temperature_2m_min"
        case precipitationSum = "precipitation_sum"
        case sunrise, sunset
    }
}

// MARK: - App Models

struct WeatherCondition {
    let code: Int
    let isDay: Bool

    var description: String {
        switch code {
        case 0: return isDay ? "Clear" : "Clear Night"
        case 1: return "Mostly Clear"
        case 2: return "Partly Cloudy"
        case 3: return "Overcast"
        case 45, 48: return "Foggy"
        case 51, 53, 55: return "Drizzle"
        case 61: return "Light Rain"
        case 63: return "Rain"
        case 65: return "Heavy Rain"
        case 71: return "Light Snow"
        case 73: return "Snow"
        case 75: return "Heavy Snow"
        case 80: return "Light Showers"
        case 81: return "Showers"
        case 82: return "Heavy Showers"
        case 95: return "Thunderstorm"
        case 96, 99: return "Severe Thunderstorm"
        default: return "Unknown"
        }
    }

    var sfSymbol: String {
        switch code {
        case 0: return isDay ? "sun.max.fill" : "moon.stars.fill"
        case 1: return isDay ? "sun.haze.fill" : "moon.haze.fill"
        case 2: return isDay ? "cloud.sun.fill" : "cloud.moon.fill"
        case 3: return "cloud.fill"
        case 45, 48: return "cloud.fog.fill"
        case 51, 53, 55: return "cloud.drizzle.fill"
        case 61: return "cloud.rain.fill"
        case 63: return "cloud.rain.fill"
        case 65: return "cloud.heavyrain.fill"
        case 71, 73, 75: return "cloud.snow.fill"
        case 80, 81, 82: return "cloud.heavyrain.fill"
        case 95: return "cloud.bolt.rain.fill"
        case 96, 99: return "cloud.bolt.fill"
        default: return "questionmark.circle.fill"
        }
    }

    var isRainy: Bool {
        (51...82).contains(code) || code == 95 || code == 96 || code == 99
    }

    var isSunny: Bool {
        code == 0 || code == 1
    }

    var isSnowy: Bool {
        (71...75).contains(code)
    }

    var isStormy: Bool {
        code >= 95
    }
}

struct HourlyForecastItem: Identifiable {
    let id = UUID()
    let time: Date
    let temperature: Double
    let weatherCode: Int
    let precipitationProbability: Int
    let isDay: Bool
}

struct DailyForecastItem: Identifiable {
    let id = UUID()
    let date: Date
    let weatherCode: Int
    let tempMax: Double
    let tempMin: Double
    let precipitationSum: Double
}

struct PrecipitationSlot: Identifiable {
    let id = UUID()
    let time: Date
    let amount: Double
    let probability: Int

    var intensity: PrecipIntensity {
        if amount == 0 { return .none }
        if amount < 0.5 { return .light }
        if amount < 2.0 { return .moderate }
        return .heavy
    }
}

enum PrecipIntensity {
    case none, light, moderate, heavy

    var label: String {
        switch self {
        case .none: return "No rain"
        case .light: return "Light rain"
        case .moderate: return "Moderate rain"
        case .heavy: return "Heavy rain"
        }
    }
}
