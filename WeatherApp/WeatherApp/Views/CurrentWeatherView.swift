import SwiftUI

struct CurrentWeatherView: View {
    @Bindable var viewModel: WeatherViewModel

    var body: some View {
        VStack(spacing: 4) {
            // Location
            HStack(spacing: 4) {
                Image(systemName: "location.fill")
                    .font(.system(size: 13))
                Text(viewModel.locationName)
                    .font(.system(size: 17, weight: .medium))
            }
            .foregroundStyle(.white.opacity(0.9))

            // Temperature
            Text(viewModel.temperature)
                .font(.system(size: 96, weight: .thin))
                .foregroundStyle(.white)
                .kerning(-3)

            // Condition icon + label
            if let condition = viewModel.currentCondition {
                HStack(spacing: 8) {
                    Image(systemName: condition.sfSymbol)
                        .symbolRenderingMode(.multicolor)
                        .font(.system(size: 22))
                    Text(condition.description)
                        .font(.system(size: 20, weight: .light))
                        .foregroundStyle(.white.opacity(0.9))
                }
            }

            // H/L
            Text("H:\(viewModel.todayHigh)  L:\(viewModel.todayLow)")
                .font(.system(size: 17, weight: .medium))
                .foregroundStyle(.white.opacity(0.75))
                .padding(.top, 2)

            // Detail pills
            HStack(spacing: 12) {
                WeatherPill(icon: "thermometer.medium", label: "Feels like", value: viewModel.feelsLike)
                WeatherPill(icon: "humidity", label: "Humidity", value: viewModel.humidity)
                WeatherPill(icon: "wind", label: "Wind", value: viewModel.windSpeed)
            }
            .padding(.top, 16)
        }
        .padding(.top, 20)
        .padding(.horizontal, 20)
    }
}

struct WeatherPill: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundStyle(.white.opacity(0.8))
            Text(value)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(.white)
            Text(label)
                .font(.system(size: 11))
                .foregroundStyle(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
    }
}
