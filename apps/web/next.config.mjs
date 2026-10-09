/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/monodeal",
        destination: "/#games",
        permanent: true,
      },
      {
        source: "/lowdeck",
        destination: "/#games",
        permanent: true,
      },
      {
        source: "/monodeal/cards",
        destination: "/cards?game=monodeal",
        permanent: true,
      },
      {
        source: "/lowdeck/cards",
        destination: "/cards?game=least_count",
        permanent: true,
      },
      {
        source: "/monodeal/how-to-play",
        destination: "/how-to-play?game=monodeal",
        permanent: true,
      },
      {
        source: "/lowdeck/how-to-play",
        destination: "/how-to-play?game=least_count",
        permanent: true,
      },
      {
        source: "/monodeal/rules",
        destination: "/rules?game=monodeal",
        permanent: true,
      },
      {
        source: "/lowdeck/rules",
        destination: "/rules?game=least_count",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
