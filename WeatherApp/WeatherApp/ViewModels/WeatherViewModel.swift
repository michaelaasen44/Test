import Foundation
import CoreLocation
import Observation

@Observable
final class WeatherViewModel: NSObject {
    var weather: OpenMeteoResponse?
    var isLoading = false
    var error: String?
    var locationName = "Loading..."
    var authorizationStatus: CLAuthorizationStatus = .notDetermined

    private let locationManager = CLLocationManager()
    private var currentLocation: CLLocation?

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    func requestLocationAndFetch() {
        switch locationManager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            locationManager.requestLocation()
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .denied, .restricted:
            // Fall back to a default location (New York)
            Task { await self.fetchWeather(lat: 40.7128, lon: -74.0060) }
        @unknown default:
            break
        }
    }

    @MainActor
    func fetchWeather(lat: Double, lon: Double) async {
        isLoading = true
        error = nil

        do {
            let response = try await WeatherService.shared.fetchWeather(latitude: lat, longitude: lon)
            weather = response
            await resolveLocationName(lat: lat, lon: lon)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    private func resolveLocationName(lat: Double, lon: Double) async {
        let geocoder = CLGeocoder()
        let location = CLLocation(latitude: lat, longitude: lon)
        if let placemark = try? await geocoder.reverseGeocodeLocation(location).first {
            await MainActor.run {
                locationName = placemark.locality ?? placemark.administrativeArea ?? "Unknown"
            }
        }
    }
}

// MARK: - CLLocationManagerDelegate

extension WeatherViewModel: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        currentLocation = location
        Task { await fetchWeather(lat: location.coordinate.latitude, lon: location.coordinate.longitude) }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // Fall back to New York on error
        Task { await fetchWeather(lat: 40.7128, lon: -74.0060) }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            locationManager.requestLocation()
        case .denied, .restricted:
            Task { await fetchWeather(lat: 40.7128, lon: -74.0060) }
        default:
            break
        }
    }
}

// MARK: - Convenience Accessors

extension WeatherViewModel {
    var currentCondition: WeatherCondition? {
        guard let w = weather else { return nil }
        return WeatherCondition(code: w.current.weatherCode, isDay: w.current.isDay == 1)
    }

    var temperature: String {
        guard let w = weather else { return "--" }
        return "\(Int(w.current.temperature2m.rounded()))°"
    }

    var feelsLike: String {
        guard let w = weather else { return "--" }
        return "\(Int(w.current.apparentTemperature.rounded()))°"
    }

    var humidity: String {
        guard let w = weather else { return "--" }
        return "\(w.current.relativeHumidity2m)%"
    }

    var windSpeed: String {
        guard let w = weather else { return "--" }
        return "\(Int(w.current.windSpeed10m.rounded())) km/h"
    }

    var todayHigh: String {
        guard let first = weather?.dailyForecasts.first else { return "--" }
        return "\(Int(first.tempMax.rounded()))°"
    }

    var todayLow: String {
        guard let first = weather?.dailyForecasts.first else { return "--" }
        return "\(Int(first.tempMin.rounded()))°"
    }

    var precipSummary: String {
        weather?.precipitationSummary ?? "Checking precipitation..."
    }

    var hourlyForecasts: [HourlyForecastItem] {
        weather?.hourlyForecasts ?? []
    }

    var dailyForecasts: [DailyForecastItem] {
        weather?.dailyForecasts ?? []
    }

    var precipitationSlots: [PrecipitationSlot] {
        weather?.precipitationSlots ?? []
    }

    var isDay: Bool {
        weather?.current.isDay == 1
    }
}
