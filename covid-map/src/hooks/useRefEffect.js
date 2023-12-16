// import { useEffect } from "react";

// export default function useRefEffect({ effect, ref = {} }) {
//   useEffect(() => {
//     effect(ref.current);
//   }, [effect, ref]);
// }

import { useEffect } from 'react';

const useRefEffect = ({ effect, ref = {} }) => {
  useEffect(() => {
    effect( ref.current );
  }, [effect, ref]);
};

export default useRefEffect;