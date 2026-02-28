import SwiftUI

struct HourlyForecastView: View {
    let items: [HourlyForecastItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Hourly Forecast", systemImage: "clock")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white.opacity(0.6))
                .textCase(.uppercase)
                .padding(.horizontal, 16)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 4) {
                    ForEach(items) { item in
                        HourlyItemView(item: item)
                    }
                }
                .padding(.horizontal, 16)
            }
        }
        .padding(.vertical, 12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct HourlyItemView: View {
    let item: HourlyForecastItem

    private var timeLabel: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "ha"
        return formatter.string(from: item.time).lowercased()
    }

    private var condition: WeatherCondition {
        WeatherCondition(code: item.weatherCode, isDay: item.isDay)
    }

    var body: some View {
        VStack(spacing: 6) {
            Text(timeLabel)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.7))

            Image(systemName: condition.sfSymbol)
                .symbolRenderingMode(.multicolor)
                .font(.system(size: 22))

            if item.precipitationProbability > 10 {
                Text("\(item.precipitationProbability)%")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Color(hex: "7fc8f8"))
            } else {
                Spacer().frame(height: 14)
            }

            Text("\(Int(item.temperature.rounded()))°")
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(.white)
        }
        .frame(width: 52)
        .padding(.vertical, 10)
    }
}
