import SwiftUI

struct ContentView: View {
    @State private var viewModel = WeatherViewModel()

    var body: some View {
        ZStack {
            // Dynamic background
            WeatherBackgroundView(
                condition: viewModel.currentCondition,
                isDay: viewModel.isDay
            )

            // Weather particles (rain / snow)
            WeatherParticleView(condition: viewModel.currentCondition)

            if viewModel.isLoading && viewModel.weather == nil {
                LoadingView()
            } else if let error = viewModel.error, viewModel.weather == nil {
                ErrorView(message: error) {
                    viewModel.requestLocationAndFetch()
                }
            } else {
                WeatherScrollView(viewModel: viewModel)
            }
        }
        .onAppear {
            viewModel.requestLocationAndFetch()
        }
    }
}

// MARK: - Main Scroll Content

struct WeatherScrollView: View {
    @Bindable var viewModel: WeatherViewModel

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                // Current conditions header
                CurrentWeatherView(viewModel: viewModel)
                    .padding(.top, 60)

                // Precipitation next 2 hours
                PrecipitationView(
                    slots: viewModel.precipitationSlots,
                    summary: viewModel.precipSummary
                )

                // Hourly forecast
                if !viewModel.hourlyForecasts.isEmpty {
                    HourlyForecastView(items: viewModel.hourlyForecasts)
                }

                // 7-day forecast
                if !viewModel.dailyForecasts.isEmpty {
                    DailyForecastView(items: viewModel.dailyForecasts)
                }

                // Attribution
                Text("Weather data from Open-Meteo")
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.4))
                    .padding(.bottom, 40)
            }
            .padding(.horizontal, 16)
        }
        .refreshable {
            viewModel.requestLocationAndFetch()
        }
    }
}

// MARK: - Loading / Error states

struct LoadingView: View {
    @State private var opacity = 0.4
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .tint(.white)
                .scaleEffect(1.4)
            Text("Fetching weather...")
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(.white.opacity(opacity))
                .onAppear {
                    withAnimation(.easeInOut(duration: 1).repeatForever()) {
                        opacity = 1
                    }
                }
        }
    }
}

struct ErrorView: View {
    let message: String
    let retry: () -> Void
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 44))
                .foregroundStyle(.white.opacity(0.8))
            Text(message)
                .font(.system(size: 15))
                .foregroundStyle(.white.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Button("Try Again", action: retry)
                .foregroundStyle(.white)
                .padding(.horizontal, 32)
                .padding(.vertical, 12)
                .background(.white.opacity(0.2), in: Capsule())
        }
    }
}
