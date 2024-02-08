export const getStatColor = (statValue: number): string => {
    if (statValue < 60) {
      return '#D57E7E';
    } else if (statValue >= 60 && statValue < 85) {
      return '#E0C097';
    } else if (statValue >= 85 && statValue < 100) {
      return '#FFE1AF';
    } else {
      return '#C6D57E';
    }
  };

  export default getStatColor;