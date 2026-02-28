import SwiftUI

struct WeatherBackgroundView: View {
    let condition: WeatherCondition?
    let isDay: Bool

    var body: some View {
        LinearGradient(
            colors: gradientColors,
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
        .animation(.easeInOut(duration: 1.5), value: gradientColors.map { $0.description })
    }

    private var gradientColors: [Color] {
        guard let condition else {
            return [Color(hex: "1a1a2e"), Color(hex: "16213e")]
        }

        if condition.isStormy {
            return [Color(hex: "1a1a2e"), Color(hex: "2d2d44"), Color(hex: "3d3a4b")]
        }
        if condition.isSnowy {
            return [Color(hex: "6e8fa8"), Color(hex: "a8c0cc"), Color(hex: "d0e4ef")]
        }
        if condition.isRainy {
            return isDay
                ? [Color(hex: "2c4a6b"), Color(hex: "3d6486"), Color(hex: "4a7a9b")]
                : [Color(hex: "0d1b2a"), Color(hex: "1b2838"), Color(hex: "243447")]
        }
        if condition.isSunny {
            return isDay
                ? [Color(hex: "1a6fa8"), Color(hex: "2b8fcc"), Color(hex: "58a8d4")]
                : [Color(hex: "0a0a1a"), Color(hex: "0d1433"), Color(hex: "1a1f4a")]
        }
        // Cloudy / default
        return isDay
            ? [Color(hex: "4a5568"), Color(hex: "718096"), Color(hex: "8fa3b1")]
            : [Color(hex: "1a1a2e"), Color(hex: "2d2d44"), Color(hex: "16213e")]
    }
}

// MARK: - Animated particle layer (rain / snow effect)

struct WeatherParticleView: View {
    let condition: WeatherCondition?
    @State private var animate = false

    var body: some View {
        if let condition {
            if condition.isRainy || condition.isStormy {
                RainView(heavy: condition.isStormy || condition.code >= 63)
            } else if condition.isSnowy {
                SnowView()
            }
        }
    }
}

struct RainDrop: Identifiable {
    let id = UUID()
    let x: CGFloat
    let delay: Double
    let speed: Double
    let length: CGFloat
    let opacity: Double
}

struct RainView: View {
    let heavy: Bool
    private let drops: [RainDrop]

    init(heavy: Bool) {
        self.heavy = heavy
        let count = heavy ? 80 : 40
        drops = (0..<count).map { _ in
            RainDrop(
                x: CGFloat.random(in: 0...1),
                delay: Double.random(in: 0...1.5),
                speed: Double.random(in: 0.4...0.8),
                length: CGFloat.random(in: 15...35),
                opacity: Double.random(in: 0.2...0.5)
            )
        }
    }

    var body: some View {
        GeometryReader { geo in
            ForEach(drops) { drop in
                RainDropShape(length: drop.length)
                    .stroke(Color.white.opacity(drop.opacity), lineWidth: 1)
                    .frame(width: 2, height: drop.length)
                    .position(x: drop.x * geo.size.width, y: -drop.length)
                    .modifier(FallingModifier(height: geo.size.height + drop.length,
                                             delay: drop.delay,
                                             speed: drop.speed))
            }
        }
        .clipped()
        .allowsHitTesting(false)
    }
}

struct RainDropShape: Shape {
    let length: CGFloat
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: rect.midX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.midX - 1, y: rect.maxY))
        return p
    }
}

struct FallingModifier: ViewModifier {
    let height: CGFloat
    let delay: Double
    let speed: Double
    @State private var offset: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .offset(y: offset)
            .onAppear {
                withAnimation(
                    .linear(duration: speed)
                    .repeatForever(autoreverses: false)
                    .delay(delay)
                ) {
                    offset = height
                }
            }
    }
}

struct SnowFlake: Identifiable {
    let id = UUID()
    let x: CGFloat
    let size: CGFloat
    let delay: Double
    let speed: Double
    let drift: CGFloat
}

struct SnowView: View {
    private let flakes: [SnowFlake] = (0..<40).map { _ in
        SnowFlake(
            x: CGFloat.random(in: 0...1),
            size: CGFloat.random(in: 3...7),
            delay: Double.random(in: 0...3),
            speed: Double.random(in: 2...5),
            drift: CGFloat.random(in: -30...30)
        )
    }

    var body: some View {
        GeometryReader { geo in
            ForEach(flakes) { flake in
                Circle()
                    .fill(Color.white.opacity(0.7))
                    .frame(width: flake.size, height: flake.size)
                    .position(x: flake.x * geo.size.width, y: -10)
                    .modifier(DriftingFallModifier(
                        height: geo.size.height + 20,
                        drift: flake.drift,
                        delay: flake.delay,
                        speed: flake.speed
                    ))
            }
        }
        .clipped()
        .allowsHitTesting(false)
    }
}

struct DriftingFallModifier: ViewModifier {
    let height: CGFloat
    let drift: CGFloat
    let delay: Double
    let speed: Double
    @State private var offsetY: CGFloat = 0
    @State private var offsetX: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .offset(x: offsetX, y: offsetY)
            .onAppear {
                withAnimation(
                    .linear(duration: speed)
                    .repeatForever(autoreverses: false)
                    .delay(delay)
                ) {
                    offsetY = height
                    offsetX = drift
                }
            }
    }
}

// MARK: - Color hex helper

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
