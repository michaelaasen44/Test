import SwiftUI

/// The signature Dark Sky-style "next 2 hours" precipitation bar chart.
struct PrecipitationView: View {
    let slots: [PrecipitationSlot]
    let summary: String

    private let barCount = 24 // 15-min slots × 24 = 6 hours shown, we display first 8 (2h)
    private var displaySlots: [PrecipitationSlot] {
        Array(slots.prefix(8))
    }
    private var maxAmount: Double {
        max(slots.prefix(8).map(\.amount).max() ?? 1.0, 0.1)
    }
    private var hasAnyPrecip: Bool {
        slots.prefix(8).contains { $0.amount > 0 }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Summary line
            Text(summary)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(.white)

            if displaySlots.isEmpty {
                // Placeholder flat bar
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.white.opacity(0.15))
                    .frame(height: 60)
            } else {
                HStack(alignment: .bottom, spacing: 2) {
                    ForEach(displaySlots) { slot in
                        PrecipBar(
                            slot: slot,
                            maxAmount: maxAmount,
                            hasAnyPrecip: hasAnyPrecip
                        )
                    }
                }
                .frame(height: 60)

                // Time axis
                HStack {
                    Text("Now")
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.6))
                    Spacer()
                    Text("+1h")
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.6))
                    Spacer()
                    Text("+2h")
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.6))
                }
            }
        }
        .padding(16)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct PrecipBar: View {
    let slot: PrecipitationSlot
    let maxAmount: Double
    let hasAnyPrecip: Bool
    @State private var appeared = false

    private var fillFraction: Double {
        guard hasAnyPrecip else { return 0 }
        return min(slot.amount / maxAmount, 1.0)
    }

    private var barColor: Color {
        switch slot.intensity {
        case .none: return .white.opacity(0.15)
        case .light: return Color(hex: "7fc8f8")
        case .moderate: return Color(hex: "4aa8f0")
        case .heavy: return Color(hex: "1a78c2")
        }
    }

    var body: some View {
        GeometryReader { geo in
            VStack(spacing: 0) {
                Spacer()
                RoundedRectangle(cornerRadius: 3)
                    .fill(barColor)
                    .frame(height: max(4, geo.size.height * (appeared ? fillFraction : 0)))
                    .animation(.spring(response: 0.5, dampingFraction: 0.7).delay(Double.random(in: 0...0.15)), value: appeared)
            }
        }
        .onAppear { appeared = true }
    }
}
