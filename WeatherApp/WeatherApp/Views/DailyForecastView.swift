import SwiftUI

struct DailyForecastView: View {
    let items: [DailyForecastItem]

    private var tempRange: ClosedRange<Double> {
        let allMin = items.map(\.tempMin).min() ?? 0
        let allMax = items.map(\.tempMax).max() ?? 40
        return allMin...allMax
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Label("7-Day Forecast", systemImage: "calendar")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white.opacity(0.6))
                .textCase(.uppercase)
                .padding(.horizontal, 16)
                .padding(.bottom, 10)

            Divider().background(.white.opacity(0.15))

            ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                DailyRowView(item: item, globalRange: tempRange)
                if index < items.count - 1 {
                    Divider().background(.white.opacity(0.1))
                }
            }
        }
        .padding(.vertical, 12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct DailyRowView: View {
    let item: DailyForecastItem
    let globalRange: ClosedRange<Double>

    private var dayLabel: String {
        if Calendar.current.isDateInToday(item.date) { return "Today" }
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        return formatter.string(from: item.date)
    }

    private var condition: WeatherCondition {
        WeatherCondition(code: item.weatherCode, isDay: true)
    }

    private var rangeWidth: Double {
        globalRange.upperBound - globalRange.lowerBound
    }

    private var lowFraction: Double {
        guard rangeWidth > 0 else { return 0 }
        return (item.tempMin - globalRange.lowerBound) / rangeWidth
    }

    private var highFraction: Double {
        guard rangeWidth > 0 else { return 1 }
        return (item.tempMax - globalRange.lowerBound) / rangeWidth
    }

    var body: some View {
        HStack(spacing: 12) {
            // Day name
            Text(dayLabel)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(.white)
                .frame(width: 70, alignment: .leading)

            // Weather icon
            Image(systemName: condition.sfSymbol)
                .symbolRenderingMode(.multicolor)
                .font(.system(size: 22))
                .frame(width: 28)

            // Low temp
            Text("\(Int(item.tempMin.rounded()))°")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(.white.opacity(0.5))
                .frame(width: 36, alignment: .trailing)

            // Temp range bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(.white.opacity(0.15))
                        .frame(height: 6)

                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "7fc8f8"), Color(hex: "f6a623")],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(
                            width: max(6, geo.size.width * (highFraction - lowFraction)),
                            height: 6
                        )
                        .offset(x: geo.size.width * lowFraction)
                }
            }
            .frame(height: 6)

            // High temp
            Text("\(Int(item.tempMax.rounded()))°")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(.white)
                .frame(width: 36, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }
}
