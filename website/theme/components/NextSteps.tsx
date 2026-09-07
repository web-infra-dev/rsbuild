import type { ReactNode } from 'react';
import styles from './NextSteps.module.scss';

const NextSteps = (props: { children?: ReactNode }) => {
  return <div className={styles.nextSteps}>{props.children}</div>;
};

export default NextSteps;
