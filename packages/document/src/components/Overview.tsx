import { NoSSR } from 'rspress/runtime';
import { useUrl } from '../utils';
import styles from './Overview.module.scss';

export interface GroupItem {
  text: string;
  link: string;
}

export interface Group {
  name: string;
  items: GroupItem[];
}

declare const OVERVIEW_GROUPS: Group[];

export default function Overview() {
  const Nodes = OVERVIEW_GROUPS.map((group) => (
    <>
      <div className={styles.overviewGroups}>
        <div className={styles.group}>
          <h2>{group.name}</h2>
          <ul>
            {group.items.map((item) => (
              <li key={item.text}>
                <a href={useUrl(item.link)}>{item.text}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  ));

  return (
    <NoSSR>
      <div className={styles.root}>{Nodes}</div>
    </NoSSR>
  );
}
