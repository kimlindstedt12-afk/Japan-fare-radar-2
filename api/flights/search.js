export default async function handler(req, res) {
  res.status(200).json({
    routes: [
      {
        id: 100,
        start: "ARN",
        outboundAirport: "HND",
        inboundAirport: "KIX",
        outbound: "ARN-HEL-HND",
        inbound: "KIX-HEL-ARN",
        airline: "Finnair",
        depart: "2027-03-12",
        home: "2027-03-27",
        adultFare: 5200,
        infantFare: 500,
        positioningAdult: 0,
        groundTransport: 0,
        baggage: 0,
        outboundHours: 14.2,
        inboundHours: 14.0,
        longestLayover: 1.5,
        baseline: 8500,
        protected: true
      }
    ]
  });
}