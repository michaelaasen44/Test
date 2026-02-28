import Foundation

enum WeatherError: LocalizedError {
    case invalidURL
    case networkError(Error)
    case decodingError(Error)
    case noData

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .networkError(let e): return "Network error: \(e.localizedDescription)"
        case .decodingError(let e): return "Data error: \(e.localizedDescription)"
        case .noData: return "No data received"
        }
    }
}

actor WeatherService {
    static let shared = WeatherService()

    private let baseURL = "https://api.open-meteo.com/v1/forecast"

    func fetchWeather(latitude: Double, longitude: Double) async throws -> OpenMeteoResponse {
        var components = URLComponents(string: baseURL)!
        components.queryItems = [
            URLQueryItem(name: "latitude", value: String(format: "%.4f", latitude)),
            URLQueryItem(name: "longitude", value: String(format: "%.4f", longitude)),
            URLQueryItem(name: "current", value: [
                "temperature_2m",
                "apparent_temperature",
                "weather_code",
                "wind_speed_10m",
                "relative_humidity_2m",
                "is_day"
            ].joined(separator: ",")),
            URLQueryItem(name: "minutely_15", value: [
                "precipitation",
                "precipitation_probability"
            ].joined(separator: ",")),
            URLQueryItem(name: "hourly", value: [
                "temperature_2m",
                "apparent_temperature",
                "weather_code",
                "precipitation_probability"
            ].joined(separator: ",")),
            URLQueryItem(name: "daily", value: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "sunrise",
                "sunset"
            ].joined(separator: ",")),
            URLQueryItem(name: "timezone", value: "auto"),
            URLQueryItem(name: "forecast_days", value: "7"),
            URLQueryItem(name: "forecast_minutely_15", value: "8") // next 2 hours
        ]

        guard let url = components.url else { throw WeatherError.invalidURL }

        let (data, _): (Data, URLResponse)
        do {
            (data, _) = try await URLSession.shared.data(from: url)
        } catch {
            throw WeatherError.networkError(error)
        }

        do {
            let decoder = JSONDecoder()
            return try decoder.decode(OpenMeteoResponse.self, from: data)
        } catch {
            throw WeatherError.decodingError(error)
        }
    }
}

// MARK: - Data Transformers

extension OpenMeteoResponse {
    private static let isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withFullDate, .withTime, .withColonSeparatorInTime]
        return f
    }()

    private static let dateOnlyFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    var hourlyForecasts: [HourlyForecastItem] {
        let now = Date()
        let formatter = OpenMeteoResponse.isoFormatter
        return zip(hourly.time.indices, hourly.time).compactMap { idx, timeStr in
            guard let date = formatter.date(from: timeStr), date >= now else { return nil }
            return HourlyForecastItem(
                time: date,
                temperature: hourly.temperature2m[idx],
                weatherCode: hourly.weatherCode[idx],
                precipitationProbability: hourly.precipitationProbability[idx],
                isDay: date.isDaytime(sunrise: nil, sunset: nil)
            )
        }.prefix(24).map { $0 }
    }

    var dailyForecasts: [DailyForecastItem] {
        let formatter = OpenMeteoResponse.dateOnlyFormatter
        return daily.time.indices.compactMap { idx in
            guard let date = formatter.date(from: daily.time[idx]) else { return nil }
            return DailyForecastItem(
                date: date,
                weatherCode: daily.weatherCode[idx],
                tempMax: daily.temperature2mMax[idx],
                tempMin: daily.temperature2mMin[idx],
                precipitationSum: daily.precipitationSum[idx]
            )
        }
    }

    var precipitationSlots: [PrecipitationSlot] {
        guard let m15 = minutely15 else { return [] }
        let formatter = OpenMeteoResponse.isoFormatter
        return m15.time.indices.compactMap { idx in
            guard let date = formatter.date(from: m15.time[idx]) else { return nil }
            return PrecipitationSlot(
                time: date,
                amount: m15.precipitation[idx],
                probability: m15.precipitationProbability[idx]
            )
        }
    }

    var precipitationSummary: String {
        let slots = precipitationSlots
        guard !slots.isEmpty else { return "No precipitation expected" }

        let now = Date()
        let upcoming = slots.filter { $0.time >= now }

        if let firstRain = upcoming.first(where: { $0.amount > 0 }) {
            let mins = Int(firstRain.time.timeIntervalSince(now) / 60)
            if mins <= 0 {
                return "\(firstRain.intensity.label) now"
            } else if mins == 1 {
                return "\(firstRain.intensity.label) in 1 minute"
            } else {
                return "\(firstRain.intensity.label) in \(mins) min"
            }
        }

        if upcoming.allSatisfy({ $0.amount == 0 }) {
            return "No rain in the next 2 hours"
        }

        return "Light rain possible"
    }
}

extension Date {
    func isDaytime(sunrise: Date?, sunset: Date?) -> Bool {
        let hour = Calendar.current.component(.hour, from: self)
        return hour >= 6 && hour < 20
    }
}
