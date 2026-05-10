'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, AreaSeries } from 'lightweight-charts';
import { PricePoint } from '../types/game';

interface TVChartProps {
    data: PricePoint[];
    currency: 'USD' | 'IDR';
    timeframe: '1s' | '10s' | '1m';
}

export default function TradingViewChart({ data, currency, timeframe }: TVChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

    // Initial Chart Setup
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#181a20' },
                textColor: '#848e9c',
            },
            grid: {
                vertLines: { color: '#2b3139' },
                horzLines: { color: '#2b3139' },
            },
            rightPriceScale: {
                borderVisible: false,
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: timeframe !== '1m', // hide seconds if 1m chart
            },
            crosshair: {
                vertLine: {
                    color: '#848e9c',
                    width: 1,
                    style: 3,
                },
                horzLine: {
                    color: '#848e9c',
                    width: 1,
                    style: 3,
                },
            },
        });

        const series = chart.addSeries(AreaSeries, {
            topColor: 'rgba(14, 204, 131, 0.4)',
            bottomColor: 'rgba(14, 204, 131, 0)',
            lineColor: '#0ecc83',
            lineWidth: 2,
        });

        chartRef.current = chart;
        seriesRef.current = series;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);
        // Initial fit
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [timeframe]); // Re-create chart if timeframe changes significantly to adjust timeScale formatting

    // Data Sync
    useEffect(() => {
        if (!seriesRef.current || data.length === 0) return;

        // Lightweight charts requires time to be in UNIX timestamp in seconds (not milliseconds)
        const formattedData = data.map(point => {
            const priceMultiplier = currency === 'USD' ? 1 : 15000;
            return {
                time: (Math.floor(point.time / 1000)) as Time,
                value: point.close * priceMultiplier,
            };
        });

        // To avoid duplicate times, we make sure they are strictly increasing
        // Sometimes aggregating leaves exact same timestamps if doing it weirdly, so we deduplicate
        const uniqueData = [];
        let lastTime = 0;
        for (const pt of formattedData) {
            if ((pt.time as number) > lastTime) {
                uniqueData.push(pt);
                lastTime = pt.time as number;
            }
        }

        if (uniqueData.length > 0) {
            seriesRef.current.setData(uniqueData);

            // Adjust line color based on trend of the dataset
            const isUp = uniqueData.length >= 2
                ? uniqueData[uniqueData.length - 1].value >= uniqueData[uniqueData.length - 2].value
                : true;

            seriesRef.current.applyOptions({
                topColor: isUp ? 'rgba(14, 204, 131, 0.4)' : 'rgba(246, 70, 93, 0.4)',
                bottomColor: isUp ? 'rgba(14, 204, 131, 0)' : 'rgba(246, 70, 93, 0)',
                lineColor: isUp ? '#0ecc83' : '#f6465d',
            });
        }

    }, [data, currency]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full h-full min-h-[300px]"
            style={{ position: 'relative' }}
        />
    );
}
